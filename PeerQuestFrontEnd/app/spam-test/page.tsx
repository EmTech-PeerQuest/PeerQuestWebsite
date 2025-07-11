'use client'

import { useState } from 'react'
import { DebouncedButton, SubmitButton, DangerButton } from '@/components/ui/debounced-button'

export default function ButtonSpamTestPage() {
  const [clickCount, setClickCount] = useState(0)
  const [apiCallCount, setApiCallCount] = useState(0)
  const [lastResult, setLastResult] = useState<string>('')

  const simulateAPICall = async () => {
    console.log('API call triggered')
    setApiCallCount(prev => prev + 1)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simulate random success/failure
    if (Math.random() > 0.3) {
      setLastResult('Success!')
    } else {
      setLastResult('Failed!')
      throw new Error('Simulated API error')
    }
  }

  const handleRegularClick = () => {
    setClickCount(prev => prev + 1)
    console.log('Regular click', clickCount + 1)
  }

  return (
    <div className="min-h-screen bg-[#2D1B69] text-[#F4F0E6] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Button Spam Prevention Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Regular Button (No Protection) */}
          <div className="bg-[#3D2A2F] p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Regular Button (Vulnerable to Spam)</h2>
            <button
              onClick={handleRegularClick}
              className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 mb-4"
            >
              Click Me (No Protection)
            </button>
            <p>Click count: {clickCount}</p>
            <p className="text-sm text-gray-400">Try spam-clicking this button!</p>
          </div>

          {/* Debounced Button */}
          <div className="bg-[#3D2A2F] p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Debounced Button (Protected)</h2>
            <DebouncedButton
              onClick={() => setClickCount(prev => prev + 1)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
              debounceMs={500}
            >
              Click Me (Debounced)
            </DebouncedButton>
            <p>Click count: {clickCount}</p>
            <p className="text-sm text-gray-400">This button ignores rapid clicks!</p>
          </div>

          {/* Submit Button with API Simulation */}
          <div className="bg-[#3D2A2F] p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Submit Button (API Protection)</h2>
            <SubmitButton
              onClick={simulateAPICall}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mb-4"
              loadingText="Saving..."
              successText="Saved!"
              errorText="Error!"
            >
              Submit Data
            </SubmitButton>
            <p>API calls made: {apiCallCount}</p>
            <p>Last result: {lastResult}</p>
            <p className="text-sm text-gray-400">Prevents duplicate API calls!</p>
          </div>

          {/* Danger Button */}
          <div className="bg-[#3D2A2F] p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Danger Button (Extra Protection)</h2>
            <DangerButton
              onClick={() => alert('Dangerous action performed!')}
              className="w-full px-4 py-2 mb-4"
            >
              Delete Something
            </DangerButton>
            <p className="text-sm text-gray-400">Has longer debounce for dangerous actions!</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-[#3D2A2F] p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Try rapidly clicking the <strong>Regular Button</strong> - notice how every click increments the counter</li>
            <li>Try rapidly clicking the <strong>Debounced Button</strong> - only the last click in a burst will count</li>
            <li>Try spam-clicking the <strong>Submit Button</strong> - it will only make one API call even if clicked multiple times</li>
            <li>The <strong>Danger Button</strong> has extra protection with a longer debounce time</li>
            <li>All protected buttons also play satisfying click sounds!</li>
          </ul>
        </div>

        {/* Debug Info */}
        <div className="mt-8 bg-[#3D2A2F] p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Debug Info</h2>
          <p className="text-sm">Check the browser console for click logs</p>
          <p className="text-sm">Total clicks registered: {clickCount}</p>
          <p className="text-sm">API calls made: {apiCallCount}</p>
        </div>
      </div>
    </div>
  )
}
