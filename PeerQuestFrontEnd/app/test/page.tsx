"use client"

import { useEffect, useState } from 'react'

export default function TestPage() {
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const testAPI = async () => {
    setLoading(true)
    setError('')
    try {
      console.log('Testing categories API...')
      const response = await fetch('http://localhost:8000/api/quests/categories/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Categories data:', data)
      setCategories(data)
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      
      <button 
        onClick={testAPI}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Categories API'}
      </button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}
      
      {categories.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Categories ({categories.length}):</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(categories, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
