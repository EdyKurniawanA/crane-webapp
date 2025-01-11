import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function ContactPage() {
  const developers = [
    {
      name: "Developer 1",
      role: "Frontend Developer",
      email: "edykurniawanelektronika@gmail.com",
      phone: "+62 896-1271-5579"
    },
    {
      name: "Developer 2",
      role: "Backend Developer",
      email: "edykurniawanelektronika@gmail.com",
      phone: "+62 896-1271-5579"
    },
    {
      name: "Developer 3",
      role: "IoT Specialist",
      email: "afwanjml@gmail.com",
      phone: "+62 877-6122-4552"
    },
    {
      name: "Developer 4",
      role: "UI/UX Designer",
      email: "yeremiayohanis.tkj@gmail.com",
      phone: "+62 852-9846-7001"
    },
    {
      name: "Developer 5",
      role: "System Architect",
      email: "hatildakhaerani10@gmail.com",
      phone: "+62 859-6655-0786"
    },
    {
      name: "Developer 6",
      role: "Hardware Engineer",
      email: "aprialdidimusprasetyo@gmail.com",
      phone: "+62 852-8246-9974"
    },
    {
      name: "Developer 7",
      role: "Quality Assurance",
      email: "citrawardaniardiatisuardi@gmail.com",
      phone: "+62 812-4111-1887"
    },
    {
      name: "Developer 8",
      role: "Project Manager",
      email: "risaldipoltek17@gmail.com",
      phone: "+62 897-8043-479"
    }
  ]

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full mb-8">
        <CardHeader>
          <CardTitle>Development Team</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Meet our talented team of developers and engineers.</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {developers.map((dev, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-xl">{dev.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium text-primary">{dev.role}</p>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Email:</p>
                <p className="text-sm">{dev.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Phone:</p>
                <p className="text-sm">{dev.phone}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

