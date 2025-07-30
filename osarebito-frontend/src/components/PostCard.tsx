'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'

interface Props {
  author: string
  authorIcon?: string | null
  category?: string | null
  content: string
  image?: string | null
  createdAt: string
  actions?: React.ReactNode
  children?: React.ReactNode
  compact?: boolean
}

export default function PostCard({
  author,
  authorIcon,
  category,
  content,
  image,
  createdAt,
  actions,
  children,
  compact = false,
}: Props) {
  const [icon, setIcon] = useState<string | null>(authorIcon || null)

  useEffect(() => {
    if (!authorIcon) {
      axios
        .get(`/api/users/${author}`)
        .then((res) => {
          setIcon(res.data.profile?.profile_image || null)
        })
        .catch(() => {
          /* ignore */
        })
    }
  }, [author, authorIcon])

  return (
    <div className={`rounded-lg bg-white shadow ${compact ? 'p-2 text-sm' : 'p-4'}`}>
      <div className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600 flex items-center gap-2`}>
        {icon && (
          <img
            src={icon}
            alt="icon"
            className={`${compact ? 'w-4 h-4' : 'w-6 h-6'} rounded-full`}
          />
        )}
        <span>{author}</span>
      </div>
      {category && !compact && (
        <div className="text-xs text-pink-600 mb-1">[{category}]</div>
      )}
      <p>{content}</p>
      {image && !compact && (
        <img src={image} alt="post image" className="max-h-60 mt-2" />
      )}
      {children}
      {actions && (
        <div className="mt-2 flex gap-4 text-sm items-center">{actions}</div>
      )}
      <div className="text-right text-xs text-gray-500 mt-1">
        {new Date(createdAt).toLocaleString()}
      </div>
    </div>
  )
}
