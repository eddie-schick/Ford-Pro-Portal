import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Eye, Camera, CheckCircle } from 'lucide-react'

// Map image filenames to chassis/body type combinations
const COMPLETED_UNIT_IMAGES = {
  'F-350': {
    'Service Body': '/completed-units/F-350 and Service body.png',
    'Contractor Body': '/completed-units/F-350 and Contactor Body.png',
    'Dump Body': '/completed-units/F-350 and Dump Body.png',
    'Flatbed': '/completed-units/F-350 and Platform Body.png'
  },
  'F-450': {
    'Service Body': '/completed-units/F-450 and Service Body.png',
    'Contractor Body': '/completed-units/F-450 and Contractor Body.png',
    'Dump Body': '/completed-units/F-450 and Dumpy Body.png',
    'Flatbed': '/completed-units/F-450 and Platform Body.png',
    'Dry Freight Body': '/completed-units/F-450 and Box Truck w Lift Gate.png',
    'Tow & Recovery': '/completed-units/F-450 and Tow.png',
    'Ambulance': '/completed-units/F-450 and Ambulance.png'
  }
}

function CompletedUnitCard({ chassis, bodyType, imageSrc, isExact }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  return (
    <Card className={`hover:shadow-lg transition-shadow ${isExact ? 'ring-2 ring-green-500' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{chassis} + {bodyType}</CardTitle>
          {isExact && (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              Your Build
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <AspectRatio ratio={16/10}>
          {!imageError ? (
            <img
              src={imageSrc}
              alt={`${chassis} with ${bodyType}`}
              className={`w-full h-full object-cover rounded-lg transition-opacity ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Camera className="w-8 h-8 mx-auto mb-2" />
                <div className="text-sm">Image not available</div>
              </div>
            </div>
          )}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gray-100 rounded-lg animate-pulse" />
          )}
        </AspectRatio>
      </CardContent>
    </Card>
  )
}

export function CompletedUnitsGallery({ 
  selectedChassis = null, 
  selectedBodyType = null,
  className = '',
  title = "Completed Unit Examples"
}) {
  const [relevantImages, setRelevantImages] = useState([])

  useEffect(() => {
    const images = []
    
    // If both chassis and body type are selected, show exact match first
    if (selectedChassis && selectedBodyType) {
      const exactImage = COMPLETED_UNIT_IMAGES[selectedChassis]?.[selectedBodyType]
      if (exactImage) {
        images.push({
          chassis: selectedChassis,
          bodyType: selectedBodyType,
          imageSrc: exactImage,
          isExact: true
        })
      }
    }

    // Add related images for the selected chassis
    if (selectedChassis && COMPLETED_UNIT_IMAGES[selectedChassis]) {
      Object.entries(COMPLETED_UNIT_IMAGES[selectedChassis]).forEach(([bodyType, imageSrc]) => {
        // Skip if it's already added as exact match
        if (bodyType !== selectedBodyType) {
          images.push({
            chassis: selectedChassis,
            bodyType,
            imageSrc,
            isExact: false
          })
        }
      })
    }

    // If no chassis selected, show a variety of examples
    if (!selectedChassis) {
      // Show one example from each chassis
      Object.entries(COMPLETED_UNIT_IMAGES).forEach(([chassis, bodyTypes]) => {
        // Pick the first body type for each chassis as an example
        const firstBodyType = Object.keys(bodyTypes)[0]
        if (firstBodyType) {
          images.push({
            chassis,
            bodyType: firstBodyType,
            imageSrc: bodyTypes[firstBodyType],
            isExact: false
          })
        }
      })
    }

    // Add other chassis examples if we have selected body type but different chassis
    if (selectedBodyType && !selectedChassis) {
      Object.entries(COMPLETED_UNIT_IMAGES).forEach(([chassis, bodyTypes]) => {
        if (bodyTypes[selectedBodyType]) {
          images.push({
            chassis,
            bodyType: selectedBodyType,
            imageSrc: bodyTypes[selectedBodyType],
            isExact: false
          })
        }
      })
    }

    // Remove duplicates and limit to reasonable number
    const uniqueImages = images.filter((img, index, self) => 
      index === self.findIndex(i => i.chassis === img.chassis && i.bodyType === img.bodyType)
    ).slice(0, 6)

    setRelevantImages(uniqueImages)
  }, [selectedChassis, selectedBodyType])

  if (relevantImages.length === 0) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>
          {selectedChassis && selectedBodyType 
            ? `See how your ${selectedChassis} + ${selectedBodyType} combination looks, plus similar builds`
            : selectedChassis
            ? `Example builds with ${selectedChassis} chassis`
            : selectedBodyType  
            ? `Example ${selectedBodyType} builds on different chassis`
            : 'Browse example completed units'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {relevantImages.map((image, index) => (
            <CompletedUnitCard
              key={`${image.chassis}-${image.bodyType}-${index}`}
              chassis={image.chassis}
              bodyType={image.bodyType}
              imageSrc={image.imageSrc}
              isExact={image.isExact}
            />
          ))}
        </div>
        
        {relevantImages.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-600">
            <Eye className="w-4 h-4 inline mr-1" />
            {relevantImages.filter(img => img.isExact).length > 0 
              ? 'Green border shows your exact configuration'
              : 'Select chassis and body type to see your exact build'}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Smaller version for sidebars
export function CompletedUnitsPreview({ selectedChassis, selectedBodyType, className = '' }) {
  const exactImage = selectedChassis && selectedBodyType 
    ? COMPLETED_UNIT_IMAGES[selectedChassis]?.[selectedBodyType]
    : null

  if (!exactImage) return null

  return (
    <Card className={`${className} bg-green-50 border-green-200`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          Your Build Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AspectRatio ratio={16/10}>
          <img
            src={exactImage}
            alt={`${selectedChassis} with ${selectedBodyType}`}
            className="w-full h-full object-cover rounded-lg"
          />
        </AspectRatio>
        <div className="text-xs text-green-700 mt-2 text-center">
          {selectedChassis} + {selectedBodyType}
        </div>
      </CardContent>
    </Card>
  )
}
