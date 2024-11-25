'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { gameRounds } from '@/app/rounds'

export function FourPhotosOneStartup() {
  const [completedRounds, setCompletedRounds] = useState<number[]>([])
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number | null>(
    null
  )
  const [userGuess, setUserGuess] = useState('')
  const [error, setError] = useState('')
  const [gameCompleted, setGameCompleted] = useState(false)
  const [hint, setHint] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const getRandomRound = useCallback(() => {
    const availableRounds = gameRounds
      .map((_, index) => index)
      .filter((index) => !completedRounds.includes(index))

    if (availableRounds.length === 0) {
      setGameCompleted(true)
      return null
    }

    const randomIndex = Math.floor(Math.random() * availableRounds.length)
    return availableRounds[randomIndex]
  }, [completedRounds])

  useEffect(() => {
    const firstRound = getRandomRound()
    setCurrentRoundIndex(firstRound)
  }, [getRandomRound])

  const generateHint = useCallback(() => {
    if (currentRoundIndex === null) return

    const answer = gameRounds[currentRoundIndex].answer

    const currentHint = hint || '_'.repeat(answer.length)
    const revealedIndices = new Set(
      currentHint
        .split('')
        .map((char, index) => (char !== '_' ? index : -1))
        .filter((i) => i !== -1)
    )

    if (revealedIndices.size === answer.length) return // All letters revealed

    let randomIndex
    do {
      randomIndex = Math.floor(Math.random() * answer.length)
    } while (revealedIndices.has(randomIndex))

    const newHint = currentHint
      .split('')
      .map((char, index) => (index === randomIndex ? answer[index] : char))
      .join('')

    setHint(newHint)
  }, [currentRoundIndex, hint])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentRoundIndex === null) return

    if (
      userGuess.toLowerCase() ===
      gameRounds[currentRoundIndex].answer.toLowerCase()
    ) {
      setCompletedRounds((prev) => [...prev, currentRoundIndex])
      const nextRound = getRandomRound()
      setCurrentRoundIndex(nextRound)
      setUserGuess('')
      setError('')
      setHint('')
    } else {
      setError('Incorrect guess. Try again!')
    }
  }

  if (gameCompleted) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-lg shadow-xl text-center">
        <h1 className="text-3xl font-bold mb-4">Congratulations!</h1>
        <p className="text-xl">You've completed all the rounds!</p>
        <p className="mt-4">Total rounds completed: {completedRounds.length}</p>
      </div>
    )
  }

  if (currentRoundIndex === null) return null

  return (
    <>
      <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="md:text-3xl text-xl font-bold text-center">
            4 Photos 1 Startup
          </h1>
          <span className="text-lg">
            Solved: {completedRounds.length}/{gameRounds.length}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-6 mb-8">
          {gameRounds[currentRoundIndex].images.map((src, index) => (
            <div
              key={src}
              className="cursor-pointer transition-transform hover:scale-[1.02] relative rounded-lg overflow-hidden"
              onClick={() => setSelectedImage(src)}
            >
              <Image
                src={src}
                alt={`Startup hint ${index + 1}`}
                width={500}
                height={500}
                className="object-cover"
              />
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="guess" className="text-lg">
              Guess the startup:
            </Label>
            <Input
              id="guess"
              type="text"
              placeholder="Enter startup name"
              value={userGuess}
              onChange={(e) => {
                setUserGuess(e.target.value)
                setError('')
              }}
              className={`text-lg p-6 ${error ? 'border-red-500' : ''}`}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <div className="flex justify-between items-center gap-4">
            <Button type="submit" className="flex-grow text-lg py-6">
              Submit Guess
            </Button>
            <Button
              type="button"
              onClick={generateHint}
              variant="outline"
              className="text-lg py-6"
            >
              Hint
            </Button>
          </div>
        </form>
        {hint && (
          <div className="mt-6 text-center">
            <p className="text-2xl font-mono">{hint}</p>
          </div>
        )}
      </div>

      <footer className="max-w-2xl mx-auto mt-4 mb-8 text-center text-sm text-gray-500">
        <p>
          made by{' '}
          <a
            href="https://github.com/NicolasMontone/4-photos-1-startup"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 font-bold transition-colors"
          >
            monto
          </a>{' '}
          ✨ with{' '}
          <a
            href="https://v0.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 font-bold transition-colors"
          >
            v0
          </a>
        </p>
      </footer>

      {/* Image Zoom Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <Image
              src={selectedImage}
              alt="Zoomed startup hint"
              width={800}
              height={800}
              className="rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </>
  )
}
