import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const json = await request.json()
    const { title, content, published, image, event } = json

    // Validate the image data
    if (!image || typeof image !== 'string') {
      return new NextResponse('Invalid image data', { status: 400 })
    }

    // Create the image post with the base64 data
    const imagePost = await prisma.imagePost.create({
      data: {
        title,
        content,
        published,
        image, // Store the base64 string directly
        author: {
          connect: { id: session.user.id }
        },
        ...(event && {
          event: {
            connect: { id: event.connect.id }
          }
        })
      },
      include: {
        author: true
      }
    })

    return NextResponse.json(imagePost)
  } catch (error) {
    console.error('Error creating image post:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 