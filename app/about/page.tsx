import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader className="border-b border-gray-200 pb-4">
          <CardTitle className="text-3xl font-bold text-center text-primary">
            About Our Class
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <p>
            Betro stands for class 3B with the Electronics Engineering study program. 
            This class consists of final year students who focus on learning and developing skills in electronics. 
            As part of the Electronics Engineering study program, this class is a center of creativity and innovation in modern technology, 
            preparing students for the challenges of the industrial world and future technology.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-gray-200 pb-4">
          <CardTitle className="text-3xl font-bold text-center text-primary">
            About The Project
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <p>
            The development of the industry, the production carried out by an industry is required to be faster with a larger capacity. 
            Therefore, in the industrial world, tools are now needed to move and lift goods ranging from simple ones to those that use automatic technology. 
            One of the aircraft means of lifting and moving goods is a crane. In this case, the use of cranes is combined with the sophistication of today&apos;s technology, 
            namely IoT-based. With this web application, it is easy for users to monitor each component on the crane. 
            This allows workers to monitor cranes without having to have physical contact. 
            This web application provides actual information based on the components on the crane. Overhead Crane web application makes it easy to monitor a crane
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-gray-200 pb-4">
          <CardTitle className="text-3xl font-bold text-center text-primary">
            Contributing Teams
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <p>This project is a collaborative effort between multiple teams:</p>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-xl mb-2">Mechanics Team</h3>
              <ul className="list-disc pl-6 space-y-1 grid grid-cols-2">
                <li>Riswandi Rukman (PIC)</li>
                <li>Leo Agung Hariwanman</li>
                <li>Muh. Raihan Ramadhan</li>
                <li>Muh. Husein Haikal</li>
                <li>Adrian</li>
                <li>Marchel Ambaa</li>
                <li>Muhammad Dhifan Rizqi</li>
                <li>Ahmad Adnan</li>
                <li>Rehand Pratama Salinding</li>
                <li>Delfa Chintia Sari</li>
                <li>Tifanny Putri Januarianty</li>
                <li>Yusti Fajriani</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-xl mb-2">Microcontroller Team</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Muhammad Ihwanuddin (PIC)</li>
                <li>Muhammad Fikri Aby Thoriq</li>
                <li>Syauqi Fawwaz</li>
                <li>Naufal Hidayat</li>
                <li>Fiqra Amalia Dahlan</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

