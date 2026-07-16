import { CustomSignInForm } from '@/features/auth/components/CustomSignInForm'
import Image from 'next/image'

export default function Page() {
  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Left side - Login Form */}
      <div className="flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-8 xl:w-[45%]">
        <div className="mx-auto w-full max-w-sm lg:max-w-md flex flex-col items-center">
          <div className="mb-10 w-full flex justify-center">
            <Image 
              src="/ethio_logo_full.png" 
              alt="Ethio Telecom Logo" 
              width={250} 
              height={80} 
              className="object-contain"
              priority
            />
          </div>
          
          <div className="w-full">
            <CustomSignInForm />
          </div>
        </div>
      </div>
      
      {/* Right side - Hero Image */}
      <div className="hidden lg:block lg:w-1/2 xl:w-[55%] relative h-screen">
        <Image 
          src="/login-hero.png"
          alt="Generator Fuel Monitoring"
          fill
          priority
          className="object-cover"
        />
      </div>
    </div>
  )
}
