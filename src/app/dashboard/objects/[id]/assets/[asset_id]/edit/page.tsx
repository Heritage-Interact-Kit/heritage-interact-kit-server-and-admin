'use client'
import React, { useEffect, useState, useRef, useLayoutEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, RotateCcw, Music, Video } from 'lucide-react'
import { VideoUpload } from '@/components/ui/video-upload'
import Link from 'next/link'
import { type Asset, type InteractionMethod } from '@/types/assets'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { Suspense } from 'react'
import * as THREE from 'three'



const INTERACTION_METHOD_LABELS = {
  place_on_plane: 'Place on Plane',
  show_on_marker: 'Show on Marker',
  show_ar_portal: 'Show AR Portal',
  show_directly: 'Show Directly'
}

// Model loader components for different file types
const GLTFModel = ({ url }: { url: string }) => {
  const gltf = useGLTF(url)
  const modelRef = useRef<THREE.Group>(null)

  useEffect(() => {
    if (modelRef.current) {
      // Center and scale the model
      const box = new THREE.Box3().setFromObject(modelRef.current)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      
      const maxSize = Math.max(size.x, size.y, size.z)
      const scale = 3 / maxSize
      
      modelRef.current.scale.multiplyScalar(scale)
      modelRef.current.position.sub(center.multiplyScalar(scale))
    }
  }, [gltf])

  return <primitive ref={modelRef} object={gltf.scene} />
}

const OBJModel = ({ url }: { url: string }) => {
  const [model, setModel] = useState<THREE.Group | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadOBJ = async () => {
      try {
        const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js')
        const { MTLLoader } = await import('three/examples/jsm/loaders/MTLLoader.js')
        
        const loader = new OBJLoader()
        
        // Check if there's an MTL file (materials)
        const mtlUrl = url.replace(/\.obj$/i, '.mtl')
        
        try {
          // Try to load MTL first
          const mtlLoader = new MTLLoader()
          const materials = await new Promise<unknown>((resolve, reject) => {
            mtlLoader.load(
              mtlUrl,
              resolve,
              () => {},
              reject
            )
          })
          
          ;(materials as { preload: () => void }).preload()
          // Type assertion needed for MTLLoader result compatibility
          loader.setMaterials(materials as Parameters<typeof loader.setMaterials>[0])
        } catch (e) {
          // MTL not found, continue without materials
          console.log('No MTL file found, loading OBJ without materials')
        }
        
        // Load OBJ
        const object = await new Promise<THREE.Group>((resolve, reject) => {
          loader.load(
            url,
            resolve,
            () => {},
            reject
          )
        })
        
        // Center and scale the model
        const box = new THREE.Box3().setFromObject(object)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        
        const maxSize = Math.max(size.x, size.y, size.z)
        const scale = 3 / maxSize
        
        object.scale.multiplyScalar(scale)
        object.position.sub(center.multiplyScalar(scale))
        
        // Add basic material if none exists
        object.traverse((child) => {
          if (child instanceof THREE.Mesh && !child.material) {
            child.material = new THREE.MeshPhongMaterial({ color: 0x888888 })
          }
        })
        
        setModel(object)
      } catch (err) {
        console.error('Failed to load OBJ:', err)
        setError(err instanceof Error ? err.message : 'Failed to load OBJ model')
      }
    }
    
    loadOBJ()
  }, [url])

  if (error) throw new Error(error)
  if (!model) return null
  
  return <primitive object={model} />
}

// Model component that handles different file types
const Model = ({ url }: { url: string }) => {
  const isObjFile = url.toLowerCase().endsWith('.obj')
  const isGlbFile = url.toLowerCase().endsWith('.glb') || url.toLowerCase().endsWith('.gltf')
  
  if (isObjFile) {
    return <OBJModel url={url} />
  } else if (isGlbFile) {
    return <GLTFModel url={url} />
  } else {
    throw new Error(`Unsupported model format: ${url.split('.').pop()}`)
  }
}

// Loading component
const LoadingFallback = () => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshBasicMaterial color="#e0e0e0" wireframe />
  </mesh>
)

// Error boundary component
class ModelErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: string) => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: (error: string) => void }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    this.props.onError(error.message)
  }

  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}

// Three.js 3D Model Preview Component
const ModelPreview = ({ modelUrl }: { modelUrl: string }) => {
  const [error, setError] = useState<string | null>(null)

  if (!modelUrl || modelUrl.length === 0) {
    return (
      <div className="w-full h-48 border rounded relative overflow-hidden bg-gradient-to-br from-red-50 to-orange-50 flex flex-col items-center justify-center">
        <Eye className="h-8 w-8 mb-2 text-red-400" />
        <p className="text-sm text-center font-medium text-red-600">No model URL provided</p>
      </div>
    )
  }

  return (
    <div className="w-full h-48 border rounded relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={0.5} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />
        
        {/* Model with error boundary */}
        <Suspense fallback={<LoadingFallback />}>
          <ModelErrorBoundary onError={setError}>
            {!error && <Model url={modelUrl} />}
          </ModelErrorBoundary>
        </Suspense>
        
        {/* Controls */}
        <OrbitControls 
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          autoRotate={true}
          autoRotateSpeed={1}
        />
      </Canvas>
      
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-orange-50 bg-opacity-90 flex flex-col items-center justify-center">
          <Eye className="h-8 w-8 mb-2 text-red-400" />
          <p className="text-sm text-center font-medium text-red-600">Failed to load 3D model</p>
          <p className="text-xs text-center text-red-400 mt-1 px-4">{error}</p>
        </div>
      )}
      
      {/* Instructions overlay */}
      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
        Drag to rotate • Scroll to zoom
      </div>
      
      {/* View file link */}
      <div className="absolute bottom-2 right-2">
        <a 
          href={modelUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800 underline bg-white bg-opacity-80 px-2 py-1 rounded"
        >
          View File
        </a>
      </div>
    </div>
  )
}

export default function EditAssetPage({
  params,
}: {
  params: Promise<{ id: string; asset_id: string }>
}) {
  const supabase = createClient()
  const router = useRouter()
  const [asset, setAsset] = useState<Asset | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [interactionMethod, setInteractionMethod] = useState<InteractionMethod>('place_on_plane')
  const [file, setFile] = useState<File | null>(null)
  const [markerImage, setMarkerImage] = useState<File | null>(null)
  const [thumbnailImage, setThumbnailImage] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [resolvedParams, setResolvedParams] = useState<{ id: string; asset_id: string } | null>(null)
  
  // Track which fields to clear
  const [clearThumbnail, setClearThumbnail] = useState(false)
  const [clearAudio, setClearAudio] = useState(false)
  const [clearVideo, setClearVideo] = useState(false)
  const [clearModel, setClearModel] = useState(false)

  useEffect(() => {
    const initParams = async () => {
      const p = await params
      setResolvedParams(p)
    }
    initParams()
  }, [params])

  useEffect(() => {
    if (resolvedParams) {
      fetchAsset()
    }
  }, [resolvedParams])

  const fetchAsset = async () => {
    if (!resolvedParams) return
    
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', resolvedParams.asset_id)
      .single()
    if (data) {
      setAsset(data)
      setTitle(data.title || '')
      setDescription(data.description || '')
      setInteractionMethod(data.interaction_method || 'place_on_plane')
      setVideoUrl(data.video_url || null)
    }
  }

  const handleUpdate = async () => {
    if (!resolvedParams) return
    
    try {
      setUpdating(true)
      
      // If a new model file is provided, use the replace API
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('asset_id', resolvedParams.asset_id)

        const response = await fetch('/api/assets/replace', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Model replacement failed')
        }
      }

      // Update asset details and files
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('interaction_method', interactionMethod)
      
      if (markerImage) {
        formData.append('marker_image', markerImage)
      }
      
      if (thumbnailImage) {
        formData.append('thumbnail_image', thumbnailImage)
      }

      if (audioFile) {
        formData.append('audio_file', audioFile)
      }

      if (videoUrl && videoUrl !== (asset?.video_url || null)) {
        formData.append('video_url', videoUrl)
      }
      
      // Append clear flags
      formData.append('clear_thumbnail', clearThumbnail.toString())
      formData.append('clear_audio', clearAudio.toString())
      formData.append('clear_video', clearVideo.toString())
      formData.append('clear_model', clearModel.toString())

      const response = await fetch(`/api/assets/${resolvedParams.asset_id}`, {
        method: 'PUT',
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Update failed:', {
          status: response.status,
          statusText: response.statusText,
          url: `/api/assets/${resolvedParams.asset_id}`,
          errorText
        })
        throw new Error(`Update failed: ${response.status} ${response.statusText}`)
      }
      
      // Refresh the asset data and reset file states
      await fetchAsset()
      setFile(null)
      setMarkerImage(null)
      setThumbnailImage(null)
      setAudioFile(null)
      
      // Reset clear flags
      setClearThumbnail(false)
      setClearAudio(false)
      setClearVideo(false)
      setClearModel(false)
      
      // Reset file input fields
      const fileInputs = document.querySelectorAll('input[type="file"]')
      fileInputs.forEach(input => {
        if (input instanceof HTMLInputElement) {
          input.value = ''
        }
      })
      
      // Show success message (optional)
      alert('Asset updated successfully!')
    } catch (error) {
      alert(`Error updating asset: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error(error)
    } finally {
      setUpdating(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleMarkerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMarkerImage(e.target.files[0])
    }
  }

  const handleThumbnailImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setThumbnailImage(e.target.files[0])
    }
  }

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAudioFile(e.target.files[0])
    }
  }



  const hasChanges = () => {
    if (!asset) return false
    return (
      title !== (asset.title || '') ||
      description !== (asset.description || '') ||
      interactionMethod !== asset.interaction_method ||
      file !== null ||
      markerImage !== null ||
      thumbnailImage !== null ||
      audioFile !== null ||
      videoUrl !== (asset.video_url || null) ||
      clearThumbnail ||
      clearAudio ||
      clearVideo ||
      clearModel
    )
  }

  return (
    <div className="space-y-6">
      {/* Navigation Bar */}
      <div className="pb-2 border-b border-gray-100">
        <Link href={`/dashboard/objects/${resolvedParams?.id}/assets`}>
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assets
          </Button>
        </Link>
      </div>

      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Edit Asset</h1>
        {asset?.title && (
          <p className="text-lg text-gray-600">
            Editing: <span className="font-medium">{asset.title}</span>
          </p>
        )}
      </div>

      {asset && resolvedParams && (
        <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="Enter asset title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter asset description"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                  />
                </div>
                {/* <div>
                  <Label htmlFor="interaction_method">Interaction Method</Label>
                  <Select 
                    value={interactionMethod} 
                    onValueChange={(value: InteractionMethod) => setInteractionMethod(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(INTERACTION_METHOD_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div> */}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Image</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {asset.thumbnail_image_url && !clearThumbnail ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Current Image:</p>
                      <div className="relative">
                        <img 
                          src={asset.thumbnail_image_url} 
                          alt="Current thumbnail" 
                          className="w-full h-48 object-contain rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setClearThumbnail(true)}
                          className="absolute top-2 right-2"
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gray-100 rounded-lg border flex items-center justify-center text-gray-500">
                      {clearThumbnail ? (
                        <div className="text-center">
                          <p className="text-red-600 mb-2">Image will be removed</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setClearThumbnail(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        'No Image set'
                      )}
                    </div>
                  )}
                  <div>
                    <Label htmlFor="thumbnail_image">Upload New Image</Label>
                    <Input 
                      id="thumbnail_image" 
                      type="file" 
                      onChange={handleThumbnailImageChange} 
                      accept="image/*"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Upload a new image to replace the current one
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* <Card>
              <CardHeader>
                <CardTitle>Marker Image</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {asset.marker_image_url ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Current marker:</p>
                      <img 
                        src={asset.marker_image_url} 
                        alt="Current marker" 
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gray-100 rounded-lg border flex items-center justify-center text-gray-500">
                      No marker image set
                    </div>
                  )}
                  <div>
                    <Label htmlFor="marker_image">Upload New Marker Image</Label>
                    <Input 
                      id="marker_image" 
                      type="file" 
                      onChange={handleMarkerImageChange} 
                      accept="image/*"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Upload a marker image for AR detection (required for Show on Marker interaction)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card> */}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Audio File</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {asset.audio_url && !clearAudio ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Current audio file:</p>
                    <div className="border rounded-lg p-4 bg-gray-50 relative">
                      <div className="flex items-center space-x-2 mb-2">
                        <Music className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Audio File</span>
                      </div>
                      <audio controls className="w-full mb-2">
                        <source src={asset.audio_url} />
                        Your browser does not support the audio element.
                      </audio>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setClearAudio(true)}
                        className="w-full"
                      >
                        Clear Audio
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-32 bg-gray-100 rounded-lg border flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      {clearAudio ? (
                        <>
                          <p className="text-red-600 mb-2">Audio will be removed</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setClearAudio(false)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Music className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>No audio file set</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <Label htmlFor="audio_file">Upload New Audio File</Label>
                  <Input 
                    id="audio_file" 
                    type="file" 
                    onChange={handleAudioFileChange} 
                    accept="audio/*"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Upload an audio file to accompany this asset (MP3, WAV, M4A up to 50MB)
                  </p>
                  {audioFile && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                      New audio file selected: {audioFile.name}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Video File</CardTitle>
            </CardHeader>
            <CardContent>
              {!clearVideo ? (
                <VideoUpload
                  value={videoUrl}
                  onChange={(url) => {
                    if (url === null) {
                      setClearVideo(true)
                      setVideoUrl(null)
                    } else {
                      setVideoUrl(url)
                    }
                  }}
                  bucketName="assets"
                  folder={asset?.folder_id || ''}
                  label="Video File"
                />
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Video className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-red-600 mb-3">Video will be removed</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setClearVideo(false)
                      setVideoUrl(asset.video_url || null)
                    }}
                  >
                    Cancel Removal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3D Model</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {asset.model_url && !clearModel ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Current 3D model:</p>
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium text-sm">Model File</p>
                            <p className="text-xs text-gray-500 break-all">{asset.model_url.split('/').pop()}</p>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setClearModel(true)}
                          >
                            Clear Model
                          </Button>
                        </div>
                        
                        {/* 3D Model Preview */}
                        {(() => {
                          console.log('About to render ModelPreview with asset.model_url:', asset.model_url)
                          return <ModelPreview modelUrl={asset.model_url} />
                        })()}
                        
                        {asset.material_urls && asset.material_urls.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-600 mb-1">Associated materials:</p>
                            <div className="flex flex-wrap gap-1">
                              {asset.material_urls.map((url, index) => (
                                <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  {url.split('/').pop()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="file">Replace 3D Model</Label>
                          <p className="text-sm text-gray-500">
                            Upload a new 3D model file (GLB, GLTF) or ZIP file that includes the .obj and .mtl (or .jpg) files to replace the current model
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('file')?.click()}
                          className="ml-4"
                        >
                          Choose File
                        </Button>
                      </div>
                      <Input 
                        id="file" 
                        type="file" 
                        onChange={handleFileChange} 
                        accept=".zip,.glb,.gltf"
                        className="hidden"
                      />
                      {file && (
                        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-orange-800">New model selected:</p>
                              <p className="text-sm text-orange-700">{file.name}</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setFile(null)}
                              className="text-orange-600 hover:text-orange-800"
                            >
                              Remove
                            </Button>
                          </div>
                          <p className="text-xs text-orange-600 mt-2">
                            ⚠️ This will completely replace the current 3D model and all associated materials
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
                    {clearModel ? (
                      <>
                        <p className="text-red-600 mb-3">3D Model will be removed</p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setClearModel(false)}
                        >
                          Cancel Removal
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="mb-4">No 3D model uploaded</p>
                        <div className='p-4'>
                          <Label htmlFor="file">Upload 3D Model</Label>
                          <Input 
                            id="file" 
                            type="file" 
                            onChange={handleFileChange} 
                            accept=".zip,.glb,.gltf,.obj"
                            className="mt-2"
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            Upload a 3D model file (GLB, GLTF, OBJ) or ZIP file containing your 3D model and materials
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Single Update Button at Bottom */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Link href={`/dashboard/objects/${resolvedParams.id}/assets`}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={updating || !hasChanges()}
              className="min-w-[120px]"
            >
              {updating ? 'Updating...' : 'Update Asset'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
} 