"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { addComment } from "../actions/post-actions"

interface AddCommentDialogProps {
  postId: string
}

export function AddCommentDialog({ postId }: AddCommentDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [comment, setComment] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await addComment(postId, comment)
    if (result.success) {
      setIsOpen(false)
      setComment("")
      // You might want to add some logic here to refresh the comments
    } else {
      // Handle error
      console.error(result.error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add a comment</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add a comment</DialogTitle>
          <DialogDescription>Write your comment below. Click save when you&apos;re done.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your comment here..."
          />
          <Button type="submit">Save Comment</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

