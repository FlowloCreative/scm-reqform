import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { FileText, UserCog } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="font-bold mb-4 text-white text-4xl">
            Skin Check Machine
          </h1>
          <p className="mb-2 text-white/90 font-bold text-lg">
            Request Management
          </p>
          <p className="text-sm text-white/70">
            Created by Dr.Mozz || Marketing Department
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card 
            onClick={() => navigate("/request")} 
            className="bg-white/95 backdrop-blur-sm hover:shadow-xl transition-all cursor-pointer border border-slate-200"
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-semibold text-slate-900">Submit Request</CardTitle>
              <CardDescription className="text-slate-600">Request Skin Check Machine for Event</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="w-full py-6 text-base bg-blue-600 hover:bg-blue-700 text-white">
                New Request
              </Button>
            </CardContent>
          </Card>

          <Card 
            onClick={() => navigate("/admin")} 
            className="bg-white/95 backdrop-blur-sm hover:shadow-xl transition-all cursor-pointer border border-slate-200"
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <UserCog className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle className="text-2xl font-semibold text-slate-900">Admin Portal</CardTitle>
              <CardDescription className="text-slate-600">Review and manage booking requests</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" className="w-full py-6 text-base border-slate-300 text-slate-700 hover:bg-slate-50">
                Admin Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
