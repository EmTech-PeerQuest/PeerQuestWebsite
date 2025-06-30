import { QuestAPI } from '@/lib/api/quests'
import { QuestBoard } from '@/components/quests/quest-board'
import { QuestForm } from '@/components/quests/quest-form'
import { QuestCard } from '@/components/quests/quest-card'

// Example of how to integrate the quest system

// 1. To display quests in a board with filtering
export function ExampleQuestBoard() {
  const currentUser = { id: 1, username: 'testuser', email: 'test@example.com' } // Get from auth context
  
  const handleQuestDetails = (quest) => {
    // Open quest details modal or navigate to quest page
    console.log('Opening quest details:', quest)
  }

  return (
    <QuestBoard
      currentUser={currentUser}
      openQuestDetails={handleQuestDetails}
    />
  )
}

// 2. To create or edit a quest
export function ExampleQuestForm() {
  const [showForm, setShowForm] = useState(false)
  const [editingQuest, setEditingQuest] = useState(null)

  const handleQuestSuccess = (quest) => {
    console.log('Quest saved:', quest)
    setShowForm(false)
    setEditingQuest(null)
    // Refresh quest list
  }

  return (
    <>
      <button onClick={() => setShowForm(true)}>
        Create New Quest
      </button>
      
      <QuestForm
        quest={editingQuest}
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={handleQuestSuccess}
        isEditing={!!editingQuest}
      />
    </>
  )
}

// 3. To display individual quest cards
export function ExampleQuestList() {
  const [quests, setQuests] = useState([])
  const currentUser = { id: 1, username: 'testuser' }

  useEffect(() => {
    loadQuests()
  }, [])

  const loadQuests = async () => {
    try {
      const response = await QuestAPI.getQuests({
        status: 'open',
        difficulty: 'easy'
      })
      setQuests(response.results || response)
    } catch (error) {
      console.error('Failed to load quests:', error)
    }
  }



  const handleQuestDetails = (quest) => {
    // Navigate to quest details or open modal
    console.log('Quest details:', quest)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {quests.map(quest => (
        <QuestCard
          key={quest.id}
          quest={quest}
          currentUser={currentUser}
          onViewDetails={handleQuestDetails}
        />
      ))}
    </div>
  )
}

// 4. API Usage Examples

// Create a new quest
export async function createQuest() {
  try {
    const newQuest = await QuestAPI.createQuest({
      title: "Learn React Hooks",
      description: "Build a todo app using React hooks and state management",
      category: 1, // Programming category ID
      difficulty: "medium",
      max_participants: 5,
      due_date: "2025-07-15",
      requirements: "Basic JavaScript knowledge required",
      resources: "https://reactjs.org/docs/hooks-intro.html"
    })
    console.log('Quest created:', newQuest)
  } catch (error) {
    console.error('Failed to create quest:', error)
  }
}

// Join a quest
export async function joinQuest(questSlug) {
  try {
    const result = await QuestAPI.joinQuest(questSlug)
    console.log('Joined quest:', result.message)
  } catch (error) {
    console.error('Failed to join quest:', error)
  }
}

// Get user's quests
export async function getUserQuests() {
  try {
    const createdQuests = await QuestAPI.getMyQuests('created')
    const participatingQuests = await QuestAPI.getMyQuests('participating')
    
    console.log('Created quests:', createdQuests)
    console.log('Participating quests:', participatingQuests)
  } catch (error) {
    console.error('Failed to get user quests:', error)
  }
}

// Search quests
export async function searchQuests() {
  try {
    const searchResults = await QuestAPI.searchQuests({
      search: "programming",
      available_only: true
    })
    console.log('Search results:', searchResults)
  } catch (error) {
    console.error('Failed to search quests:', error)
  }
}

// Get quest statistics
export async function getQuestStats() {
  try {
    const stats = await QuestAPI.getQuestStats()
    console.log('Quest stats:', stats)
    // stats.created_quests, stats.participating_quests, stats.completed_quests, stats.total_xp_earned
  } catch (error) {
    console.error('Failed to get quest stats:', error)
  }
}
