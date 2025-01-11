import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center space-y-8 pt-16">
      <h1 className="text-6xl font-bold tracking-tighter sm:text-7xl">
        Monitor Your IoT Devices
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl">
        Real-time monitoring of your sensors and devices with a clean, modern interface.
      </p>
      <Button asChild size="lg" className="rounded-full px-8">
        <Link href="/monitor">Get Started</Link>
      </Button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mt-16">
        <div className="space-y-4">
          <a href="/datasheets/pj-460.pdf" target="_blank" className="cursor-pointer">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden group">
              <Image
                src="/loadcell.png"
                alt="Load Cell"
                width={300}
                height={200}
                className="object-cover w-full h-full transition-all duration-300 group-hover:scale-110"
              />
            </div>
            <h3 className="text-xl font-semibold hover:text-primary transition-colors mt-2">Load Cell</h3>
          </a>
          <p className="text-muted-foreground">Precise weight and force measurements</p>
        </div>

        <div className="space-y-4">
          <a href="/datasheets/DHT22.pdf" target="_blank" className="cursor-pointer">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden group">
              <Image
                src="/dht11.png"
                alt="Temperature Sensor"
                width={300}
                height={200}
                className="object-cover w-full h-full transition-all duration-300 group-hover:scale-110"
                priority
              />
            </div>
            <h3 className="text-xl font-semibold hover:text-primary transition-colors mt-2">Temperature</h3>
          </a>
          <p className="text-muted-foreground">Real-time temperature monitoring</p>
        </div>

        <div className="space-y-4">
          <a href="/datasheets/HC-SR04.PDF" target="_blank" className="cursor-pointer">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden group">
              <Image
                src="/hcsr04.png"
                alt="HC-SR04 Sensor"
                width={300}
                height={200}
                className="object-cover w-full h-full transition-all duration-300 group-hover:scale-110"
              />
            </div>
            <h3 className="text-xl font-semibold hover:text-primary transition-colors mt-2">HC-SR04</h3>
          </a>
          <p className="text-muted-foreground">3D position tracking</p>
        </div>

        <div className="space-y-4">
          <a href="/datasheets/Vibration-Sensor-Datasheet.pdf" target="_blank" className="cursor-pointer">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden group">
              <Image
                src="/vibration.png"
                alt="Vibration Sensor"
                width={300}
                height={200}
                className="object-cover w-full h-full transition-all duration-300 group-hover:scale-110"
              />
            </div>
            <h3 className="text-xl font-semibold hover:text-primary transition-colors mt-2">Vibration</h3>
          </a>
          <p className="text-muted-foreground">Frequency analysis</p>
        </div>

        <div className="space-y-4">
          <a href="/datasheets/SER0002.pdf" target="_blank" className="cursor-pointer">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden group">
              <Image
                src="/servo.png"
                alt="Hitec HS422 Servo"
                width={300}
                height={200}
                className="object-cover w-full h-full transition-all duration-300 group-hover:scale-110"
              />
            </div>
            <h3 className="text-xl font-semibold hover:text-primary transition-colors mt-2">Servo Motor</h3>
          </a>
          <p className="text-muted-foreground">Precise position control</p>
        </div>

        <div className="space-y-4">
          <a href="https://www.instagram.com/betro22_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" className="cursor-pointer">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden group">
              <Image
                src="/betro_ig.jpg"
                alt="Betro Instagram"
                width={300}
                height={200}
                className="object-cover w-full h-full transition-all duration-300 group-hover:scale-110"
              />
            </div>
            <h3 className="text-xl font-semibold hover:text-primary transition-colors mt-2">Follow Us</h3>
          </a>
          <p className="text-muted-foreground">Our official social media account</p>
        </div>
      </div>
    </div>
  )
}

