import { openai } from '@ai-sdk/openai'
import { generateObject, generateText } from 'ai'
import { z } from 'zod'
import fs from 'fs/promises'
import path from 'path'
import axios from 'axios'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN

if (!REPLICATE_API_TOKEN) {
  throw new Error('REPLICATE_API_TOKEN is not set')
}

async function generateInitialPrompts(startup: string) {
  const { text } = await generateText({
    model: openai('o1-preview'),
    prompt: `Generate 4 image prompt descriptions that make it easy but challenging for someone to guess the startup "${startup}". The images should never give a direct resemblance to the company, only hints. It could include events related to the company, but nothing that should be directly related to it.
    
    For example, the clues for "Vercel" it should be 1 a moustache representing Guillermo (its CEO), 2 a rabbit for Evil Rabbit (its designer), 3 pyramids resembling their logo, and 4 a right arrow emoji resembling Next.js.
    For "Supabase" should be a green elephant, 

    A submarine periscope emerging above water near a base station, playing on the "sub" and "base" in the name.

    An open treasure chest filled with fire, over a base, meaning that is the open source version of Firebase.

    

    "Raycast":

A beam of light ("ray") shining onto a computer keyboard, symbolizing illumination and enhanced productivity.

An astronaut floating in space while interacting with floating icons of apps, hinting at exploration and the company's space-themed branding.

A person using a magic wand to summon applications and files instantly, representing quick access and command execution.

A side view of someone typing rapidly into a command-line interface, with commands casting rays outward to perform various tasks.

    `,
  })

  return text
}

async function structurePrompts(initialPrompts: string) {
  const { object } = await generateObject({
    model: openai('gpt-4-turbo'),
    schema: z.object({
      prompts: z.array(z.string()).length(4),
    }),
    prompt: `Structure the following image prompts into an array of 4 strings:\n\n${initialPrompts}`,
  })

  return object.prompts
}

async function generateImagePrompts(startup: string) {
  const initialPrompts = await generateInitialPrompts(startup)
  const structuredPrompts = await structurePrompts(initialPrompts)
  return structuredPrompts
}

async function generateImage(prompt: string): Promise<string> {
  const response = await axios.post(
    'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions',
    {
      input: {
        prompt,
        go_fast: true,
        megapixels: '1',
        num_outputs: 1,
        aspect_ratio: '1:1',
        output_format: 'webp',
        output_quality: 87,
        num_inference_steps: 4,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        Prefer: 'wait',
      },
    }
  )

  return response.data.output[0]
}

async function downloadImage(url: string, filename: string) {
  const response = await axios.get(url, { responseType: 'arraybuffer' })
  await fs.writeFile(filename, response.data)
}

async function updateRoundsFile(startup: string, imageFiles: string[]) {
  const roundsFilePath = path.join(process.cwd(), 'app', 'rounds', 'index.ts')
  let content = await fs.readFile(roundsFilePath, 'utf-8')

  const newRound = `
  {
    images: [
      '${imageFiles[0]}',
      '${imageFiles[1]}',
      '${imageFiles[2]}',
      '${imageFiles[3]}',
    ],
    answer: '${startup}',
  },`

  content = content.replace(
    '// Add more rounds here',
    `${newRound}\n  // Add more rounds here`
  )

  await fs.writeFile(roundsFilePath, content, 'utf-8')
}

async function main() {
  const startup = process.argv[2]

  if (!startup) {
    console.error(
      'Please provide a startup name as an argument. Example: pnpm run create vercel'
    )
    process.exit(1)
  }

  console.log(`Generating round for ${startup}...`)

  const prompts = await generateImagePrompts(startup)
  console.log('Generated prompts:', prompts)

  const imageUrls = await Promise.all(prompts.map(generateImage))

  await new Promise((resolve) => setTimeout(resolve, 5_000))

  const imageFiles = await Promise.all(
    imageUrls.map(async (url, index) => {
      const filename = `public/images/${startup}-${index + 1}.webp`
      await downloadImage(url, filename)
      return `/${filename.split('/').slice(1).join('/')}`
    })
  )

  await updateRoundsFile(startup, imageFiles)

  console.log(`Round for ${startup} has been created and added to the game.`)
}

main().catch(console.error)
