"use client"

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type Event } from '@/src/types/models'
import { useCreatePost } from '@/lib/hooks/custom/use-create-post'
import { Loader2, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { EventSelector } from './EventSelector'

interface PostCreationDialogProps {
  triggerButton?: React.ReactNode
  preselectedEvent?: Event
  onSuccess?: () => void
}

// Function to convert a file to a base64 string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

export function PostCreationDialog({ 
  triggerButton, 
  preselectedEvent,
  onSuccess 
}: PostCreationDialogProps) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(preselectedEvent || null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const createPost = useCreatePost()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user) return

    setIsSubmitting(true)
    try {
      // Convert image to base64 if present
      let base64Image = null
      if (image) {
        base64Image = await fileToBase64(image)
      }

      // Create the post with image included
      await createPost.mutateAsync({
        data: {
          title,
          content,
          published: true,
          // Include the image in the content if present
          ...(base64Image && { image: base64Image }),
          author: { connect: { id: session.user.id } },
          ...(selectedEvent && {
            event: { connect: { id: selectedEvent.id } }
          })
        }
      })

      toast({
        title: "Success!",
        description: "Your post has been created.",
      })

      // Reset form
      setTitle('')
      setContent('')
      setImage(null)
      setImagePreview(null)
      setSelectedEvent(preselectedEvent || null)
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error creating post:', error)
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      setImage(selectedFile)
      
      // Generate preview for the image
      const previewUrl = URL.createObjectURL(selectedFile)
      setImagePreview(previewUrl)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || <Button>Create Post</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create a New Post</DialogTitle>
            <DialogDescription>
              Share your thoughts and images with the community
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for your post"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">Image</Label>
              <div className="flex flex-col gap-3">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
                {imagePreview && (
                  <div className="relative aspect-video bg-muted rounded-md overflow-hidden mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                {!imagePreview && (
                  <div className="flex items-center justify-center aspect-video bg-muted rounded-md border border-dashed p-4">
                    <div className="flex flex-col items-center text-muted-foreground">
                      <ImageIcon className="h-10 w-10 mb-2" />
                      <span>No image selected</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Event</Label>
              <EventSelector 
                onEventSelect={setSelectedEvent} 
                preselectedEvent={preselectedEvent} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Post'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 