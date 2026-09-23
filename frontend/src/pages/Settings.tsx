import React, { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TopNav } from "@/components/Profile/TopNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, X, Check, Loader2, Phone, Building2, Key, Tag, Plus, Calendar, MapPin, Mail, Lock, Trash2, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Simple image cropper component using canvas
function ImageCropper({
  imageSrc,
  onCrop,
  onCancel,
}: {
  imageSrc: string;
  onCrop: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, size: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageLoad = useCallback(() => {
    if (imageRef.current && containerRef.current) {
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      // Calculate initial crop area (centered, square)
      const size = Math.min(containerWidth * 0.6, containerHeight * 0.6, 300);
      setCropArea({
        x: (containerWidth - size) / 2,
        y: (containerHeight - size) / 2,
        size: size,
      });
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if click is within crop area
    if (
      x >= cropArea.x &&
      x <= cropArea.x + cropArea.size &&
      y >= cropArea.y &&
      y <= cropArea.y + cropArea.size
    ) {
      setIsDragging(true);
      setDragStart({
        x: x - cropArea.x,
        y: y - cropArea.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragStart.x;
    const y = e.clientY - rect.top - dragStart.y;
    
    const maxX = rect.width - cropArea.size;
    const maxY = rect.height - cropArea.size;
    
    setCropArea({
      ...cropArea,
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const delta = e.deltaY > 0 ? -10 : 10;
    const newSize = Math.max(100, Math.min(400, cropArea.size + delta));
    
    const maxX = rect.width - newSize;
    const maxY = rect.height - newSize;
    
    setCropArea({
      x: Math.max(0, Math.min(cropArea.x, maxX)),
      y: Math.max(0, Math.min(cropArea.y, maxY)),
      size: newSize,
    });
  };

  const handleCrop = () => {
    if (!imageRef.current || !canvasRef.current) return;
    
    const img = imageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Set canvas size to crop area
    canvas.width = cropArea.size;
    canvas.height = cropArea.size;
    
    // Calculate source coordinates and size
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const containerAspect = (containerRef.current?.clientWidth || 1) / (containerRef.current?.clientHeight || 1);
    
    let drawWidth = img.naturalWidth;
    let drawHeight = img.naturalHeight;
    let drawX = 0;
    let drawY = 0;
    
    if (imgAspect > containerAspect) {
      // Image is wider
      drawHeight = img.naturalHeight;
      drawWidth = img.naturalHeight * containerAspect;
      drawX = (img.naturalWidth - drawWidth) / 2;
    } else {
      // Image is taller
      drawWidth = img.naturalWidth;
      drawHeight = img.naturalWidth / containerAspect;
      drawY = (img.naturalHeight - drawHeight) / 2;
    }
    
    // Calculate crop position relative to displayed image
    const scaleX = drawWidth / (containerRef.current?.clientWidth || 1);
    const scaleY = drawHeight / (containerRef.current?.clientHeight || 1);
    
    const sourceX = drawX + cropArea.x * scaleX;
    const sourceY = drawY + cropArea.y * scaleY;
    const sourceSize = cropArea.size * scaleX;
    
    // Draw cropped image to canvas
    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      cropArea.size,
      cropArea.size
    );
    
    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        onCrop(blob);
      }
    }, "image/jpeg", 0.95);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-emerald-950">Crop Profile Picture</h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div
          ref={containerRef}
          className="relative w-full h-96 bg-gray-100 rounded-xl overflow-hidden mb-4 cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Crop preview"
            className="w-full h-full object-contain"
            onLoad={handleImageLoad}
          />
          
          {/* Crop overlay */}
          <div
            className="absolute border-2 border-white shadow-lg"
            style={{
              left: `${cropArea.x}px`,
              top: `${cropArea.y}px`,
              width: `${cropArea.size}px`,
              height: `${cropArea.size}px`,
              cursor: isDragging ? "grabbing" : "grab",
            }}
          >
            {/* Corner handles */}
            <div className="absolute -top-1 -left-1 w-4 h-4 bg-white border-2 border-emerald-600 rounded-full" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white border-2 border-emerald-600 rounded-full" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-white border-2 border-emerald-600 rounded-full" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white border-2 border-emerald-600 rounded-full" />
          </div>
          
          {/* Dark overlay outside crop area */}
          <div
            className="absolute inset-0 bg-black/50 pointer-events-none"
            style={{
              clipPath: `polygon(
                0% 0%,
                0% 100%,
                ${(cropArea.x / (containerRef.current?.clientWidth || 1)) * 100}% 100%,
                ${(cropArea.x / (containerRef.current?.clientWidth || 1)) * 100}% ${(cropArea.y / (containerRef.current?.clientHeight || 1)) * 100}%,
                ${((cropArea.x + cropArea.size) / (containerRef.current?.clientWidth || 1)) * 100}% ${(cropArea.y / (containerRef.current?.clientHeight || 1)) * 100}%,
                ${((cropArea.x + cropArea.size) / (containerRef.current?.clientWidth || 1)) * 100}% ${((cropArea.y + cropArea.size) / (containerRef.current?.clientHeight || 1)) * 100}%,
                ${(cropArea.x / (containerRef.current?.clientWidth || 1)) * 100}% ${((cropArea.y + cropArea.size) / (containerRef.current?.clientHeight || 1)) * 100}%,
                ${(cropArea.x / (containerRef.current?.clientWidth || 1)) * 100}% 100%,
                100% 100%,
                100% 0%
              )`,
            }}
          />
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCrop}
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Check className="h-4 w-4 mr-2" />
            Apply Crop
          </Button>
        </div>
        
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}

const AVAILABLE_SPECIALTIES = [
  "Residential",
  "Commercial",
  "Land",
  "Luxury",
  "Investment",
  "First-time buyers",
  "New builds",
  "Vacation homes",
  "Agricultural",
  "Mixed Use",
];

export default function Settings() {
  const { currentUser, userProfile, updateProfilePicture, updateProfile, refreshUserProfile, changePassword, changeEmail, deactivateAccount } = useAuth();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Email change state
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  
  // Deactivate account state
  const [showDeactivateForm, setShowDeactivateForm] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState("");
  const [showDeactivatePassword, setShowDeactivatePassword] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  
  // Agent profile fields
  const [companyName, setCompanyName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [newSpecialty, setNewSpecialty] = useState("");
  const [yearsExp, setYearsExp] = useState<number>(0);
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [newServiceArea, setNewServiceArea] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setError(null);
    setSuccess(null);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCrop = (croppedBlob: Blob) => {
    setCroppedImage(croppedBlob);
    setSelectedImage(null);
  };

  const handleUpload = async () => {
    if (!croppedImage) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Convert blob to File
      const file = new File([croppedImage], "profile-picture.jpg", {
        type: "image/jpeg",
      });

      await updateProfilePicture(file);
      setSuccess("Profile picture updated successfully!");
      setCroppedImage(null);
      
      // Refresh after a short delay
      setTimeout(() => {
        refreshUserProfile();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile picture");
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = () => {
    const displayName =
      currentUser?.displayName ||
      [userProfile?.firstName, userProfile?.lastName].filter(Boolean).join(" ");
    if (displayName) {
      return displayName
        .split(" ")
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase())
        .join("");
    }
    if (currentUser?.email) {
      return currentUser.email[0]?.toUpperCase() || "U";
    }
    return "U";
  };

  const profilePictureUrl = currentUser?.photoURL || null;
  const isAgent = userProfile?.accountType === "agent";

  // Load agent profile data when component mounts or profile changes
  // Only load if user is actually an agent, otherwise clear fields
  useEffect(() => {
    if (isAgent && userProfile && userProfile.accountType === "agent") {
      setCompanyName(userProfile.companyName || "");
      setLicenseNumber(userProfile.licenseNumber || "");
      setPhoneNumber(userProfile.phoneNumber || "");
      setSpecialties(userProfile.specialties || []);
      setYearsExp(userProfile.yearsExp || 0);
      setServiceAreas(userProfile.serviceAreas || []);
    } else {
      // Clear agent fields if user is not an agent
      setCompanyName("");
      setLicenseNumber("");
      setPhoneNumber("");
      setSpecialties([]);
      setYearsExp(0);
      setServiceAreas([]);
    }
  }, [isAgent, userProfile]);

  const handleAddSpecialty = () => {
    const trimmed = newSpecialty.trim();
    if (trimmed && !specialties.includes(trimmed) && AVAILABLE_SPECIALTIES.includes(trimmed)) {
      setSpecialties([...specialties, trimmed]);
      setNewSpecialty("");
    }
  };

  const handleRemoveSpecialty = (specialty: string) => {
    setSpecialties(specialties.filter((s) => s !== specialty));
  };

  const handleAddServiceArea = () => {
    const trimmed = newServiceArea.trim();
    if (trimmed && !serviceAreas.includes(trimmed)) {
      setServiceAreas([...serviceAreas, trimmed]);
      setNewServiceArea("");
    }
  };

  const handleRemoveServiceArea = (area: string) => {
    setServiceAreas(serviceAreas.filter((a) => a !== area));
  };

  const handleSaveProfile = async () => {
    // Double-check that user is an agent before saving
    if (!isAgent || !currentUser || userProfile?.accountType !== "agent") {
      setError("Only real estate agents can update agent profile information.");
      return;
    }

    setIsSavingProfile(true);
    setError(null);
    setSuccess(null);

    try {
      await updateProfile({
        companyName: companyName.trim() || undefined,
        licenseNumber: licenseNumber.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        specialties: specialties.length > 0 ? specialties : undefined,
        yearsExp: yearsExp > 0 ? yearsExp : undefined,
        serviceAreas: serviceAreas.length > 0 ? serviceAreas : undefined,
      });
      setSuccess("Profile updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <TopNav />
      
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-emerald-950">Settings</h1>
          <p className="text-sm text-emerald-950/70 mt-1">Manage your account settings and preferences</p>
        </div>

        {/* Profile Picture Section */}
        <div className="bg-white rounded-2xl border border-emerald-950/10 p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                {profilePictureUrl && (
                  <AvatarImage src={profilePictureUrl} alt="Profile" />
                )}
                <AvatarFallback className="bg-emerald-900/10 text-emerald-950 text-2xl font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              {croppedImage && (
                <div className="absolute inset-0 rounded-full bg-emerald-600/20 flex items-center justify-center">
                  <Check className="h-6 w-6 text-emerald-600" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-emerald-950 mb-1">Profile Picture</h2>
              <p className="text-sm text-emerald-950/70">
                Upload a new profile picture. You can crop and adjust the focal point.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
              {success}
            </div>
          )}

          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Choose Image
            </Button>
            
            {croppedImage && (
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Profile Picture
                  </>
                )}
              </Button>
            )}
          </div>

          {croppedImage && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
              <p className="text-sm text-emerald-950/70">
                Preview your cropped image. Click "Save Profile Picture" to apply changes.
              </p>
              <img
                src={URL.createObjectURL(croppedImage)}
                alt="Cropped preview"
                className="mt-3 w-32 h-32 rounded-full object-cover border-2 border-emerald-200"
              />
            </div>
          )}
        </div>

        {/* Account Information Section */}
        <div className="bg-white rounded-2xl border border-emerald-950/10 p-6 mb-6">
          <h2 className="text-lg font-semibold text-emerald-950 mb-4">Account Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-emerald-950/70 mb-1 block">Email</label>
              <Input
                value={currentUser?.email || ""}
                disabled
                className="bg-gray-50"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-emerald-950/70 mb-1 block">Account Type</label>
              <Input
                value={userProfile?.accountType === "agent" ? "Real Estate Agent" : "Investor"}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="bg-white rounded-2xl border border-emerald-950/10 p-6 mb-6">
          <h2 className="text-lg font-semibold text-emerald-950 mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </h2>
          
          {!showPasswordForm ? (
            <Button
              onClick={() => setShowPasswordForm(true)}
              variant="outline"
              className="border-emerald-200 text-emerald-950 hover:bg-emerald-50"
            >
              <Lock className="h-4 w-4 mr-2" />
              Change Password
            </Button>
          ) : (
            <>
              {passwordError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                  {passwordSuccess}
                </div>
              )}

              <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-emerald-950/70 mb-1 block">Current Password</label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-950/50 hover:text-emerald-950"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-emerald-950/70 mb-1 block">New Password</label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-950/50 hover:text-emerald-950"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-emerald-950/70 mb-1 block">Confirm New Password</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-950/50 hover:text-emerald-950"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setShowPasswordForm(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setPasswordError(null);
                      setPasswordSuccess(null);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      setPasswordError(null);
                      setPasswordSuccess(null);
                      
                      if (!currentPassword || !newPassword || !confirmPassword) {
                        setPasswordError("Please fill in all password fields");
                        return;
                      }
                      
                      if (newPassword.length < 6) {
                        setPasswordError("New password must be at least 6 characters long");
                        return;
                      }
                      
                      if (newPassword !== confirmPassword) {
                        setPasswordError("New passwords do not match");
                        return;
                      }
                      
                      setIsChangingPassword(true);
                      try {
                        await changePassword(currentPassword, newPassword);
                        setPasswordSuccess("Password changed successfully!");
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setTimeout(() => {
                          setShowPasswordForm(false);
                          setPasswordSuccess(null);
                        }, 2000);
                      } catch (err: any) {
                        setPasswordError(err.message || "Failed to change password");
                      } finally {
                        setIsChangingPassword(false);
                      }
                    }}
                    disabled={isChangingPassword}
                    className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Changing Password...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Change Password
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Change Email Section */}
        <div className="bg-white rounded-2xl border border-emerald-950/10 p-6 mb-6">
          <h2 className="text-lg font-semibold text-emerald-950 mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Change Email
          </h2>
          
          {!showEmailForm ? (
            <Button
              onClick={() => setShowEmailForm(true)}
              variant="outline"
              className="border-emerald-200 text-emerald-950 hover:bg-emerald-50"
            >
              <Mail className="h-4 w-4 mr-2" />
              Change Email
            </Button>
          ) : (
            <>
              {emailError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  {emailError}
                </div>
              )}

              {emailSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                  {emailSuccess}
                </div>
              )}

              <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-emerald-950/70 mb-1 block">New Email Address</label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter your new email address"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-emerald-950/70 mb-1 block">Current Password</label>
              <div className="relative">
                <Input
                  type={showEmailPassword ? "text" : "password"}
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder="Enter your current password to confirm"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowEmailPassword(!showEmailPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-950/50 hover:text-emerald-950"
                >
                  {showEmailPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setShowEmailForm(false);
                      setNewEmail("");
                      setEmailPassword("");
                      setEmailError(null);
                      setEmailSuccess(null);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      setEmailError(null);
                      setEmailSuccess(null);
                      
                      if (!newEmail || !emailPassword) {
                        setEmailError("Please fill in both email and password fields");
                        return;
                      }
                      
                      setIsChangingEmail(true);
                      try {
                        await changeEmail(emailPassword, newEmail);
                        setEmailSuccess("Email changed successfully!");
                        setNewEmail("");
                        setEmailPassword("");
                        setTimeout(() => {
                          setShowEmailForm(false);
                          setEmailSuccess(null);
                        }, 2000);
                      } catch (err: any) {
                        setEmailError(err.message || "Failed to change email");
                      } finally {
                        setIsChangingEmail(false);
                      }
                    }}
                    disabled={isChangingEmail}
                    className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {isChangingEmail ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Changing Email...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Change Email
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Deactivate Account Section */}
        <div className="bg-white rounded-2xl border border-red-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Deactivate Account
          </h2>
          
          {!showDeactivateForm ? (
            <>
              <p className="text-sm text-emerald-950/70 mb-4">
                Deactivating your account will permanently delete all your data, including your profile, properties, and saved searches. This action cannot be undone.
              </p>
              <Button
                onClick={() => setShowDeactivateForm(true)}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Deactivate Account
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-red-600 font-medium">
                ⚠️ Warning: This action cannot be undone. All your data will be permanently deleted.
              </p>

              {deactivateError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  {deactivateError}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-emerald-950/70 mb-1 block">Enter Password to Confirm</label>
                <div className="relative">
                  <Input
                    type={showDeactivatePassword ? "text" : "password"}
                    value={deactivatePassword}
                    onChange={(e) => setDeactivatePassword(e.target.value)}
                    placeholder="Enter your password to confirm deactivation"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeactivatePassword(!showDeactivatePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-950/50 hover:text-emerald-950"
                  >
                    {showDeactivatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowDeactivateForm(false);
                    setDeactivatePassword("");
                    setDeactivateError(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    setDeactivateError(null);
                    
                    if (!deactivatePassword) {
                      setDeactivateError("Please enter your password to confirm");
                      return;
                    }
                    
                    setIsDeactivating(true);
                    try {
                      await deactivateAccount(deactivatePassword);
                      // Navigate to home page after successful deactivation
                      navigate("/");
                    } catch (err: any) {
                      setDeactivateError(err.message || "Failed to deactivate account");
                      setIsDeactivating(false);
                    }
                  }}
                  disabled={isDeactivating}
                  className="flex-1 bg-red-600 text-white hover:bg-red-700"
                >
                  {isDeactivating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deactivating...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Confirm Deactivation
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Agent Profile Section */}
        {isAgent && (
          <div className="bg-white rounded-2xl border border-emerald-950/10 p-6">
            <h2 className="text-lg font-semibold text-emerald-950 mb-4">Agent Profile</h2>
            
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                {success}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-emerald-950/70 mb-1 block flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Company Name
                </label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="ABC Realty"
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-emerald-950/70 mb-1 block flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  License Number
                </label>
                <Input
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="RE-12345"
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-emerald-950/70 mb-1 block flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-emerald-950/70 mb-1 block flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Specialties
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-sm text-emerald-950"
                    >
                      {specialty}
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecialty(specialty)}
                        className="hover:text-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <select
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    className="flex-1 rounded-xl border border-emerald-950/10 bg-white px-3 py-2 text-sm text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-200"
                  >
                    <option value="">Select a specialty...</option>
                    {AVAILABLE_SPECIALTIES.filter((s) => !specialties.includes(s)).map((specialty) => (
                      <option key={specialty} value={specialty}>
                        {specialty}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    onClick={handleAddSpecialty}
                    disabled={!newSpecialty}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
                <p className="mt-2 text-xs text-emerald-950/60">
                  Select your areas of expertise to help buyers find you more easily.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-emerald-950/70 mb-1 block flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Years of Experience
                </label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={yearsExp || ""}
                  onChange={(e) => setYearsExp(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full"
                />
                <p className="mt-2 text-xs text-emerald-950/60">
                  Enter the number of years you've been working as a real estate agent.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-emerald-950/70 mb-1 block flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Service Areas
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {serviceAreas.map((area) => (
                    <span
                      key={area}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-sm text-emerald-950"
                    >
                      {area}
                      <button
                        type="button"
                        onClick={() => handleRemoveServiceArea(area)}
                        className="hover:text-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newServiceArea}
                    onChange={(e) => setNewServiceArea(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddServiceArea();
                      }
                    }}
                    placeholder="Enter a service area (e.g., Lekki, Victoria Island)"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddServiceArea}
                    disabled={!newServiceArea.trim()}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
                <p className="mt-2 text-xs text-emerald-950/60">
                  List the neighborhoods, cities, or regions where you provide services.
                </p>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Cropper Modal */}
      {selectedImage && (
        <ImageCropper
          imageSrc={selectedImage}
          onCrop={handleCrop}
          onCancel={() => {
            setSelectedImage(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}
        />
      )}
    </div>
  );
}

