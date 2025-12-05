import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { FileText, UserCog } from "lucide-react";
const Index = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-slate-100 font-sans">
            Skin Check Machine
          </h1>
          <p className="mb-2 text-primary-foreground font-sans text-lg">Request Management </p>
          <p className="text-sm font-sans text-slate-100">Created by Dr.Mozz || Marketing Department</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="glass-effect hover:shadow-2xl transition-all cursor-pointer" onClick={() => navigate("/request")}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Submit Request</CardTitle>
              <CardDescription className="text-base">Request a skin check machine for your event</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg py-6">
                New Request
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-effect hover:shadow-2xl transition-all cursor-pointer" onClick={() => navigate("/admin")}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mb-4">
                <UserCog className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Admin Portal</CardTitle>
              <CardDescription className="text-base">Review and manage booking requests</CardDescription>
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