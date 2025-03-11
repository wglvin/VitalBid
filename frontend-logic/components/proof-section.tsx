"use client"

import { Badge } from "@/components/ui/badge"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileCheck, FileUp, Loader2, Check } from "lucide-react"
import { apiService } from "@/lib/api-service"
import { useToast } from "@/hooks/use-toast"

type Proof =
  | {
      proof_id: number
      proof_url: string
      verified: boolean
    }
  | null
  | undefined

type ImageProof =
  | {
      proof_id: number
      image_url: string
      verified: boolean
    }
  | null
  | undefined

export function ProofSection({
  listingId,
  proof,
  imageProof,
}: {
  listingId: number
  proof: Proof
  imageProof: ImageProof
}) {
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState<"proof" | "image" | null>(null)
  const { toast } = useToast()

  const handleProofUpload = async () => {
    if (!proofFile) return

    try {
      setUploading("proof")
      await apiService.uploadProof(listingId, proofFile)

      toast({
        title: "Proof uploaded successfully",
        description: "Your proof document has been uploaded and is pending verification.",
      })

      // Refresh the page to show the new proof
      window.location.reload()
    } catch (error) {
      console.error("Error uploading proof:", error)
      toast({
        title: "Failed to upload proof",
        description: "There was an error uploading your proof. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(null)
    }
  }

  const handleImageUpload = async () => {
    if (!imageFile) return

    try {
      setUploading("image")
      await apiService.uploadImageProof(listingId, imageFile)

      toast({
        title: "Image proof uploaded successfully",
        description: "Your image proof has been uploaded and is pending verification.",
      })

      // Refresh the page to show the new image proof
      window.location.reload()
    } catch (error) {
      console.error("Error uploading image proof:", error)
      toast({
        title: "Failed to upload image proof",
        description: "There was an error uploading your image proof. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Document Proof</CardTitle>
        </CardHeader>
        <CardContent>
          {proof ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileCheck className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>Proof Document</span>
                </div>
                <div>
                  {proof.verified ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Check className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      Pending Verification
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <a href={proof.proof_url} target="_blank" rel="noopener noreferrer">
                  View Document
                </a>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">No proof document uploaded yet</p>
              <div className="space-y-2">
                <Label htmlFor="proof-upload">Upload Proof Document</Label>
                <Input id="proof-upload" type="file" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
              </div>
              <Button onClick={handleProofUpload} disabled={!proofFile || uploading !== null} className="w-full">
                {uploading === "proof" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FileUp className="mr-2 h-4 w-4" />
                    Upload Document
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Image Proof</CardTitle>
        </CardHeader>
        <CardContent>
          {imageProof ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileCheck className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>Image Proof</span>
                </div>
                <div>
                  {imageProof.verified ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Check className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      Pending Verification
                    </Badge>
                  )}
                </div>
              </div>
              <div className="border rounded-md overflow-hidden">
                <img src={imageProof.image_url || "/placeholder.svg"} alt="Proof Image" className="w-full h-auto" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">No image proof uploaded yet</p>
              <div className="space-y-2">
                <Label htmlFor="image-upload">Upload Image Proof</Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
              </div>
              <Button onClick={handleImageUpload} disabled={!imageFile || uploading !== null} className="w-full">
                {uploading === "image" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FileUp className="mr-2 h-4 w-4" />
                    Upload Image
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

