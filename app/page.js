'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Wand2, 
  Image as ImageIcon, 
  Sparkles, 
  Camera, 
  Eraser, 
  Package, 
  Sun, 
  Download, 
  Share, 
  User, 
  LogIn, 
  LogOut,
  History,
  Settings,
  Zap,
  ArrowRight,
  Star,
  Check,
  Loader2
} from 'lucide-react'

const NeonFrameStudio = () => {
  // State management
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentJob, setCurrentJob] = useState(null)
  const [jobHistory, setJobHistory] = useState([])
  const [activeTab, setActiveTab] = useState('landing')
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState('login')

  // Form states
  const [hdForm, setHdForm] = useState({
    prompt: '',
    negativePrompt: '',
    aspectRatio: '1:1',
    numResults: 1,
    medium: 'photography',
    promptEnhancement: true
  })

  const [promptEnhanceForm, setPromptEnhanceForm] = useState({
    prompt: ''
  })

  const [lifestyleForm, setLifestyleForm] = useState({
    prompt: '',
    productImageUrl: ''
  })

  const [eraseForm, setEraseForm] = useState({
    imageUrl: ''
  })

  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: ''
  })

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('neonframe_user')
    if (savedUser) {
      const user = JSON.parse(savedUser)
      setCurrentUser(user)
      loadJobHistory(user.id)
    }
  }, [])

  // API calls
  const apiCall = async (endpoint, data) => {
    const response = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, userId: currentUser?.id })
    })
    return response.json()
  }

  const loadJobHistory = async (userId) => {
    try {
      const response = await fetch(`/api/jobs/user?userId=${userId}`)
      const data = await response.json()
      if (data.jobs) {
        setJobHistory(data.jobs)
      }
    } catch (error) {
      console.error('Failed to load job history:', error)
    }
  }

  const handleAuth = async () => {
    setLoading(true)
    try {
      const endpoint = authMode === 'login' ? 'auth/login' : 'auth/register'
      const result = await apiCall(endpoint, authForm)
      
      if (result.error) {
        alert(result.error)
      } else {
        setCurrentUser(result.user)
        localStorage.setItem('neonframe_user', JSON.stringify(result.user))
        setShowAuth(false)
        setActiveTab('studio')
        loadJobHistory(result.user.id)
        setAuthForm({ email: '', password: '', name: '' })
      }
    } catch (error) {
      alert('Authentication failed')
    }
    setLoading(false)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem('neonframe_user')
    setActiveTab('landing')
    setJobHistory([])
  }

  const handleHdGeneration = async () => {
    setLoading(true)
    try {
      const result = await apiCall('bria/hd-generation', hdForm)
      if (result.error) {
        alert(result.error)
      } else {
        setCurrentJob(result)
        if (currentUser) {
          loadJobHistory(currentUser.id)
        }
      }
    } catch (error) {
      alert('Generation failed')
    }
    setLoading(false)
  }

  const handlePromptEnhancement = async () => {
    setLoading(true)
    try {
      const result = await apiCall('bria/prompt-enhance', promptEnhanceForm)
      if (result.error) {
        alert(result.error)
      } else {
        setCurrentJob(result)
        setPromptEnhanceForm({ ...promptEnhanceForm, prompt: result.enhanced_prompt || result.prompt })
      }
    } catch (error) {
      alert('Enhancement failed')
    }
    setLoading(false)
  }

  const handleLifestyleGeneration = async () => {
    setLoading(true)
    try {
      const result = await apiCall('bria/lifestyle-text', lifestyleForm)
      if (result.error) {
        alert(result.error)
      } else {
        setCurrentJob(result)
        if (currentUser) {
          loadJobHistory(currentUser.id)
        }
      }
    } catch (error) {
      alert('Lifestyle generation failed')
    }
    setLoading(false)
  }

  const handleEraseForground = async () => {
    setLoading(true)
    try {
      const result = await apiCall('bria/erase-foreground', eraseForm)
      if (result.error) {
        alert(result.error)
      } else {
        setCurrentJob(result)
        if (currentUser) {
          loadJobHistory(currentUser.id)
        }
      }
    } catch (error) {
      alert('Erase foreground failed')
    }
    setLoading(false)
  }

  const downloadImage = (url, filename) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `neonframe-${Date.now()}.png`
    link.click()
  }

  const shareImage = async (url) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'NeonFrame Studio Creation',
          url: url
        })
      } catch (error) {
        navigator.clipboard.writeText(url)
        alert('Image URL copied to clipboard!')
      }
    } else {
      navigator.clipboard.writeText(url)
      alert('Image URL copied to clipboard!')
    }
  }

  const features = [
    {
      icon: <Wand2 className="h-8 w-8" />,
      title: "HD Image Generation",
      description: "Create stunning high-definition images from text prompts with advanced AI models."
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: "Prompt Enhancement", 
      description: "Transform simple prompts into detailed, professional descriptions for better results."
    },
    {
      icon: <Camera className="h-8 w-8" />,
      title: "Lifestyle Shots",
      description: "Generate beautiful lifestyle and product photography with contextual backgrounds."
    },
    {
      icon: <Eraser className="h-8 w-8" />,
      title: "Erase Foreground",
      description: "Remove unwanted elements from images with precision AI-powered editing."
    },
    {
      icon: <Package className="h-8 w-8" />,
      title: "Packshot Creation",
      description: "Professional product photography with perfect lighting and composition."
    },
    {
      icon: <Sun className="h-8 w-8" />,
      title: "Shadow Effects",
      description: "Add realistic shadows and lighting effects to enhance your product images."
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              NeonFrame Studio
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                <Button variant="ghost" onClick={() => setActiveTab('studio')}>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Studio
                </Button>
                <Button variant="ghost" onClick={() => setActiveTab('history')}>
                  <History className="h-4 w-4 mr-2" />
                  History
                </Button>
                <div className="flex items-center space-x-2 text-sm">
                  <Badge variant="secondary">
                    <Zap className="h-3 w-3 mr-1" />
                    {currentUser.credits || 0} credits
                  </Badge>
                  <User className="h-4 w-4" />
                  <span>{currentUser.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setActiveTab('features')}>
                  Features
                </Button>
                <Button onClick={() => setShowAuth(true)}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20">
        {/* Landing Page */}
        {activeTab === 'landing' && (
          <div className="relative">
            {/* Hero Section */}
            <section className="relative py-24 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-600/20 via-transparent to-transparent" />
              <div className="container relative">
                <div className="text-center max-w-4xl mx-auto">
                  <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-8">
                    <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                      Create Stunning
                    </span>
                    <br />
                    <span className="text-white">
                      AI Visuals
                    </span>
                  </h1>
                  
                  <p className="text-xl text-white/70 mb-12 leading-relaxed">
                    Transform your ideas into professional-grade images with our powerful AI studio.
                    Generate, enhance, and edit with cutting-edge technology.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      size="lg" 
                      onClick={() => currentUser ? setActiveTab('studio') : setShowAuth(true)}
                      className="bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:from-fuchsia-600 hover:to-cyan-600 text-white px-8 py-6 text-lg"
                    >
                      Start Creating
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      onClick={() => setActiveTab('features')}
                      className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg"
                    >
                      Explore Features
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Features Preview */}
            <section className="py-24">
              <div className="container">
                <div className="text-center mb-16">
                  <h2 className="text-4xl font-bold text-white mb-4">
                    Powerful AI Tools
                  </h2>
                  <p className="text-xl text-white/70">
                    Everything you need to create professional visuals
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {features.slice(0, 3).map((feature, index) => (
                    <Card key={index} className="border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-300">
                      <CardHeader>
                        <div className="text-fuchsia-400 mb-4">
                          {feature.icon}
                        </div>
                        <CardTitle className="text-white">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-white/70">
                          {feature.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Features Page */}
        {activeTab === 'features' && (
          <section className="py-24">
            <div className="container">
              <div className="text-center mb-16">
                <h1 className="text-5xl font-bold text-white mb-4">
                  AI-Powered Features
                </h1>
                <p className="text-xl text-white/70 max-w-2xl mx-auto">
                  Discover the complete suite of tools designed to bring your creative vision to life
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {features.map((feature, index) => (
                  <Card key={index} className="border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start space-x-4">
                        <div className="text-fuchsia-400 p-3 rounded-lg bg-fuchsia-400/10">
                          {feature.icon}
                        </div>
                        <div>
                          <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                          <CardDescription className="text-white/70 mt-2">
                            {feature.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              <div className="text-center mt-16">
                <Button 
                  size="lg"
                  onClick={() => currentUser ? setActiveTab('studio') : setShowAuth(true)}
                  className="bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:from-fuchsia-600 hover:to-cyan-600 text-white px-8 py-6 text-lg"
                >
                  {currentUser ? 'Open Studio' : 'Get Started'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Studio */}
        {activeTab === 'studio' && currentUser && (
          <div className="container py-12">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">
                AI Studio
              </h1>
              <p className="text-white/70">
                Create stunning visuals with our powerful AI tools
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Studio Tools */}
              <div className="lg:col-span-2">
                <Tabs defaultValue="hd-generation" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-white/5 backdrop-blur-xl">
                    <TabsTrigger value="hd-generation" className="text-xs">HD Generate</TabsTrigger>
                    <TabsTrigger value="enhance" className="text-xs">Enhance</TabsTrigger>
                    <TabsTrigger value="lifestyle" className="text-xs">Lifestyle</TabsTrigger>
                    <TabsTrigger value="erase" className="text-xs">Erase</TabsTrigger>
                  </TabsList>

                  {/* HD Generation */}
                  <TabsContent value="hd-generation">
                    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <Wand2 className="h-5 w-5 mr-2 text-fuchsia-400" />
                          HD Image Generation
                        </CardTitle>
                        <CardDescription className="text-white/70">
                          Create high-quality images from text descriptions
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-white text-sm font-medium mb-2 block">
                            Prompt
                          </label>
                          <Textarea
                            value={hdForm.prompt}
                            onChange={(e) => setHdForm({...hdForm, prompt: e.target.value})}
                            placeholder="Describe the image you want to create..."
                            className="bg-white/10 border-white/20 text-white placeholder-white/50"
                            rows={3}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-white text-sm font-medium mb-2 block">
                              Aspect Ratio
                            </label>
                            <Select value={hdForm.aspectRatio} onValueChange={(value) => setHdForm({...hdForm, aspectRatio: value})}>
                              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1:1">Square (1:1)</SelectItem>
                                <SelectItem value="4:3">Portrait (4:3)</SelectItem>
                                <SelectItem value="3:4">Landscape (3:4)</SelectItem>
                                <SelectItem value="16:9">Widescreen (16:9)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-white text-sm font-medium mb-2 block">
                              Style
                            </label>
                            <Select value={hdForm.medium} onValueChange={(value) => setHdForm({...hdForm, medium: value})}>
                              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="photography">Photography</SelectItem>
                                <SelectItem value="art">Art</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <label className="text-white text-sm font-medium mb-2 block">
                            Negative Prompt (Optional)
                          </label>
                          <Input
                            value={hdForm.negativePrompt}
                            onChange={(e) => setHdForm({...hdForm, negativePrompt: e.target.value})}
                            placeholder="What to avoid in the image..."
                            className="bg-white/10 border-white/20 text-white placeholder-white/50"
                          />
                        </div>

                        <Button 
                          onClick={handleHdGeneration}
                          disabled={loading || !hdForm.prompt.trim()}
                          className="w-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:from-fuchsia-600 hover:to-cyan-600"
                        >
                          {loading ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                          ) : (
                            <><Wand2 className="h-4 w-4 mr-2" />Generate Image</>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Prompt Enhancement */}
                  <TabsContent value="enhance">
                    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <Sparkles className="h-5 w-5 mr-2 text-fuchsia-400" />
                          Prompt Enhancement
                        </CardTitle>
                        <CardDescription className="text-white/70">
                          Transform basic prompts into detailed, professional descriptions
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-white text-sm font-medium mb-2 block">
                            Basic Prompt
                          </label>
                          <Textarea
                            value={promptEnhanceForm.prompt}
                            onChange={(e) => setPromptEnhanceForm({...promptEnhanceForm, prompt: e.target.value})}
                            placeholder="Enter a simple description..."
                            className="bg-white/10 border-white/20 text-white placeholder-white/50"
                            rows={4}
                          />
                        </div>

                        <Button 
                          onClick={handlePromptEnhancement}
                          disabled={loading || !promptEnhanceForm.prompt.trim()}
                          className="w-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:from-fuchsia-600 hover:to-cyan-600"
                        >
                          {loading ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enhancing...</>
                          ) : (
                            <><Sparkles className="h-4 w-4 mr-2" />Enhance Prompt</>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Lifestyle Generation */}
                  <TabsContent value="lifestyle">
                    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <Camera className="h-5 w-5 mr-2 text-fuchsia-400" />
                          Lifestyle Shots
                        </CardTitle>
                        <CardDescription className="text-white/70">
                          Create lifestyle photography with your product
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-white text-sm font-medium mb-2 block">
                            Product Image URL
                          </label>
                          <Input
                            value={lifestyleForm.productImageUrl}
                            onChange={(e) => setLifestyleForm({...lifestyleForm, productImageUrl: e.target.value})}
                            placeholder="https://example.com/product.jpg"
                            className="bg-white/10 border-white/20 text-white placeholder-white/50"
                          />
                        </div>

                        <div>
                          <label className="text-white text-sm font-medium mb-2 block">
                            Lifestyle Scene
                          </label>
                          <Textarea
                            value={lifestyleForm.prompt}
                            onChange={(e) => setLifestyleForm({...lifestyleForm, prompt: e.target.value})}
                            placeholder="Describe the lifestyle scene (e.g., 'cozy home office', 'outdoor adventure')..."
                            className="bg-white/10 border-white/20 text-white placeholder-white/50"
                            rows={3}
                          />
                        </div>

                        <Button 
                          onClick={handleLifestyleGeneration}
                          disabled={loading || !lifestyleForm.prompt.trim() || !lifestyleForm.productImageUrl.trim()}
                          className="w-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:from-fuchsia-600 hover:to-cyan-600"
                        >
                          {loading ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
                          ) : (
                            <><Camera className="h-4 w-4 mr-2" />Create Lifestyle Shot</>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Erase Foreground */}
                  <TabsContent value="erase">
                    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <Eraser className="h-5 w-5 mr-2 text-fuchsia-400" />
                          Erase Foreground
                        </CardTitle>
                        <CardDescription className="text-white/70">
                          Remove unwanted elements from your images
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-white text-sm font-medium mb-2 block">
                            Image URL
                          </label>
                          <Input
                            value={eraseForm.imageUrl}
                            onChange={(e) => setEraseForm({...eraseForm, imageUrl: e.target.value})}
                            placeholder="https://example.com/image.jpg"
                            className="bg-white/10 border-white/20 text-white placeholder-white/50"
                          />
                        </div>

                        <Button 
                          onClick={handleEraseForground}
                          disabled={loading || !eraseForm.imageUrl.trim()}
                          className="w-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:from-fuchsia-600 hover:to-cyan-600"
                        >
                          {loading ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                          ) : (
                            <><Eraser className="h-4 w-4 mr-2" />Erase Foreground</>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Results Panel */}
              <div>
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <ImageIcon className="h-5 w-5 mr-2 text-fuchsia-400" />
                      Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading && (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-fuchsia-400 mb-4" />
                        <p className="text-white/70">Creating your amazing visual...</p>
                        <Progress value={75} className="mt-4" />
                      </div>
                    )}

                    {currentJob && !loading && (
                      <div className="space-y-4">
                        {/* Enhanced Prompt */}
                        {currentJob.enhancedPrompt && (
                          <div>
                            <label className="text-white text-sm font-medium mb-2 block">
                              Enhanced Prompt
                            </label>
                            <div className="bg-white/10 border border-white/20 rounded-lg p-3 text-white/70 text-sm">
                              {currentJob.enhancedPrompt}
                            </div>
                          </div>
                        )}

                        {/* Images */}
                        {currentJob.result_urls && (
                          <div className="space-y-4">
                            {currentJob.result_urls.map((url, index) => (
                              <div key={index} className="space-y-2">
                                <img 
                                  src={url} 
                                  alt={`Generated image ${index + 1}`}
                                  className="w-full rounded-lg border border-white/20"
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                  }}
                                />
                                <div className="flex space-x-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => downloadImage(url, `neonframe-${index + 1}.png`)}
                                    className="border-white/20 text-white hover:bg-white/10"
                                  >
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => shareImage(url)}
                                    className="border-white/20 text-white hover:bg-white/10"
                                  >
                                    <Share className="h-4 w-4 mr-1" />
                                    Share
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Single Image Result */}
                        {currentJob.result_url && (
                          <div className="space-y-2">
                            <img 
                              src={currentJob.result_url} 
                              alt="Generated result"
                              className="w-full rounded-lg border border-white/20"
                              onError={(e) => {
                                e.target.style.display = 'none'
                              }}
                            />
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => downloadImage(currentJob.result_url, 'neonframe-result.png')}
                                className="border-white/20 text-white hover:bg-white/10"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => shareImage(currentJob.result_url)}
                                className="border-white/20 text-white hover:bg-white/10"
                              >
                                <Share className="h-4 w-4 mr-1" />
                                Share
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Enhanced Prompt Result */}
                        {currentJob.enhanced_prompt && (
                          <div>
                            <label className="text-white text-sm font-medium mb-2 block">
                              Enhanced Prompt
                            </label>
                            <div className="bg-white/10 border border-white/20 rounded-lg p-4 text-white text-sm">
                              {currentJob.enhanced_prompt}
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => navigator.clipboard.writeText(currentJob.enhanced_prompt)}
                              className="mt-2 border-white/20 text-white hover:bg-white/10"
                            >
                              Copy Enhanced Prompt
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {!currentJob && !loading && (
                      <div className="text-center py-8 text-white/50">
                        <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Your creations will appear here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        {activeTab === 'history' && currentUser && (
          <div className="container py-12">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">
                Your History
              </h1>
              <p className="text-white/70">
                Browse through your previous creations
              </p>
            </div>

            <ScrollArea className="h-[600px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobHistory.map((job) => (
                  <Card key={job.id} className="border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="capitalize">
                          {job.jobType.replace('-', ' ')}
                        </Badge>
                        <span className="text-xs text-white/50">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {job.output?.result_urls?.[0] && (
                        <img 
                          src={job.output.result_urls[0]} 
                          alt="Generated image"
                          className="w-full aspect-square object-cover rounded-lg mb-3"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      )}
                      {job.output?.result_url && (
                        <img 
                          src={job.output.result_url} 
                          alt="Generated image"
                          className="w-full aspect-square object-cover rounded-lg mb-3"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      )}
                      <p className="text-white/70 text-sm truncate">
                        {job.input.prompt || 'AI Generation'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            {jobHistory.length === 0 && (
              <div className="text-center py-12">
                <History className="h-12 w-12 mx-auto mb-4 text-white/30" />
                <h3 className="text-xl font-semibold text-white mb-2">No history yet</h3>
                <p className="text-white/70 mb-6">Start creating to see your work here</p>
                <Button 
                  onClick={() => setActiveTab('studio')}
                  className="bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:from-fuchsia-600 hover:to-cyan-600"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Go to Studio
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Auth Dialog */}
      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="bg-black/90 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {authMode === 'login' 
                ? 'Sign in to access your AI studio'
                : 'Join NeonFrame Studio and start creating'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Name
                </label>
                <Input
                  value={authForm.name}
                  onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                  placeholder="Your name"
                  className="bg-white/10 border-white/20 text-white placeholder-white/50"
                />
              </div>
            )}
            
            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                Email
              </label>
              <Input
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                placeholder="your@email.com"
                className="bg-white/10 border-white/20 text-white placeholder-white/50"
              />
            </div>
            
            <div>
              <label className="text-white text-sm font-medium mb-2 block">
                Password
              </label>
              <Input
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                placeholder="••••••••"
                className="bg-white/10 border-white/20 text-white placeholder-white/50"
              />
            </div>

            <Button 
              onClick={handleAuth}
              disabled={loading || !authForm.email || !authForm.password}
              className="w-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:from-fuchsia-600 hover:to-cyan-600"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : authMode === 'login' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </Button>

            <div className="text-center">
              <button
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login')
                  setAuthForm({ email: '', password: '', name: '' })
                }}
                className="text-fuchsia-400 hover:text-fuchsia-300 text-sm"
              >
                {authMode === 'login' 
                  ? "Don't have an account? Sign up" 
                  : 'Already have an account? Sign in'
                }
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default NeonFrameStudio