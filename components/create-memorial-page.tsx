import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { User } from "@/lib/types"

interface CreateMemorialPageProps {
  user: User
  onCreated: (pageId: string) => void
}

export default function CreateMemorialPage({ user, onCreated }: CreateMemorialPageProps) {
  const [name, setName] = useState("")
  const [deceasedName, setDeceasedName] = useState("")
  const [relationship, setRelationship] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [deathDate, setDeathDate] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !deceasedName.trim() || !deathDate) return

    setIsSubmitting(true)
    const { data, error } = await supabase
      .from("memorial_pages")
      .insert({
        name,
        description,
        creator_id: user.id,
        deceased_name: deceasedName,
        relationship_to_deceased: relationship,
        birth_date: birthDate || null,
        death_date: deathDate,
      })
      .select()
      .single()

    setIsSubmitting(false)
    if (error) {
      console.error("Error creating memorial page:", error)
    } else {
      setName("")
      setDeceasedName("")
      setRelationship("")
      setBirthDate("")
      setDeathDate("")
      setDescription("")
      onCreated(data.id)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Create a New Memorial Page</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Page Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <div>
          <label htmlFor="deceasedName" className="block text-sm font-medium text-gray-700">
            Name of Deceased
          </label>
          <input
            type="text"
            id="deceasedName"
            value={deceasedName}
            onChange={(e) => setDeceasedName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <div>
          <label htmlFor="relationship" className="block text-sm font-medium text-gray-700">
            Relationship to Deceased
          </label>
          <input
            type="text"
            id="relationship"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
            Birth Date
          </label>
          <input
            type="date"
            id="birthDate"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label htmlFor="deathDate" className="block text-sm font-medium text-gray-700">
            Date of Passing
          </label>
          <input
            type="date"
            id="deathDate"
            value={deathDate}
            onChange={(e) => setDeathDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          rows={3}
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
      >
        {isSubmitting ? "Creating..." : "Create Memorial Page"}
      </button>
    </form>
  )
}

