'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { gameRounds } from '@/app/rounds'

export function FourPhotosOneStartup() {
  const [currentRound, setCurrentRound] = useState(0)
  const [userGuess, setUserGuess] = useState('')
  const [error, setError] = useState('')
  const [gameCompleted, setGameCompleted] = useState(false)
  const [hint, setHint] = useState('')

  const generateHint = useCallback(() => {
    const answer = gameRounds[currentRound].answer

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
  }, [currentRound, hint])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (
      userGuess.toLowerCase() === gameRounds[currentRound].answer.toLowerCase()
    ) {
      if (currentRound < gameRounds.length - 1) {
        setCurrentRound(currentRound + 1)
        setUserGuess('')
        setError('')
        setHint('') // Reset hint for new round
      } else {
        setGameCompleted(true)
      }
    } else {
      setError('Incorrect guess. Try again!')
    }
  }

  if (gameCompleted) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl text-center">
        <h1 className="text-2xl font-bold mb-4">Congratulations!</h1>
        <p>You've completed all the rounds!</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
      <h1 className="text-2xl font-bold text-center mb-6">
        4 Photos 1 Startup
      </h1>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {gameRounds[currentRound].images.map((src, index) => (
          <Image
            key={index}
            src={src}
            alt={`Startup hint ${index + 1}`}
            width={150}
            height={150}
            className="rounded-lg"
          />
        ))}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="guess">Guess the startup:</Label>
          <Input
            id="guess"
            type="text"
            placeholder="Enter startup name"
            value={userGuess}
            onChange={(e) => {
              setUserGuess(e.target.value)
              setError('') // Clear error when user types
            }}
            className={error ? 'border-red-500' : ''}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="flex justify-between items-center">
          <Button type="submit" className="flex-grow mr-2">
            Submit Guess
          </Button>
          <Button type="button" onClick={generateHint} variant="outline">
            Hint
          </Button>
        </div>
      </form>
      {hint && (
        <div className="mt-4 text-center">
          <p className="text-lg font-mono">{hint}</p>
        </div>
      )}
    </div>
  )
}
