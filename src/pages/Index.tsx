import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { FileText, UserCog } from "lucide-react";
const Index = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Skin Check Machine
          </h1>
          <p className="text-xl text-white/90 mb-2">Request Management System</p>
          <p className="text-white/70">Created by
Dr.Mozz || Creative Marketing Executive || Marketing Department</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="glass-effect hover:shadow-2xl transition-all cursor-pointer" onClick={() => navigate("/auth")}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Submit Request</CardTitle>
              <CardDescription className="text-base">Login to request a skin check machine</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg py-6">
                User ​Login     
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-effect hover:shadow-2xl transition-all cursor-pointer" onClick={() => navigate("/admin/login")}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mb-4">
                <UserCog className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Admin Portal</CardTitle>
              <CardDescription className="text-base">Admin login to manage requests</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg py-6">
                Admin Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};
export default Index;