import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { FileText, UserCog } from "lucide-react";
const Index = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="font-bold mb-4 text-slate-100 font-sans text-4xl">
            Skin Check Machine
          </h1>
          <p className="mb-2 text-primary-foreground font-sans font-bold text-lg">Request Management </p>
          <p className="text-sm font-sans text-destructive">Created by Dr.Mozz || Marketing Department</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 shadow-2xl">
          <Card onClick={() => navigate("/request")} className="glass-effect transition-all cursor-pointer shadow-2xl text-popover-foreground">
            <CardHeader className="text-center pb-4 text-popover-foreground bg-inherit border-popover-foreground border-0">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-accent flex items-center justify-center mb-4 bg-inherit rounded-none opacity-100 text-popover-foreground">
                <FileText className="w-8 h-8 text-inherit" />
              </div>
              <CardTitle className="text-2xl font-semibold font-sans text-popover-foreground">Submit Request</CardTitle>
              <CardDescription className="text-sm text-popover-foreground">Request Skin Check Machine for Event</CardDescription>
            </CardHeader>
            <CardContent className="text-center bg-inherit shadow-2xl">
              <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity py-6 px-0 text-base text-popover-foreground bg-inherit border-popover-foreground border">
                New Request
              </Button>
            </CardContent>
          </Card>

          <Card onClick={() => navigate("/admin")} className="glass-effect hover:shadow-2xl transition-all cursor-pointer text-rose-600">
            <CardHeader className="text-center pb-4 text-rose-600">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mb-4">
                <UserCog className="w-8 h-8 text-rose-600" />
              </div>
              <CardTitle className="text-2xl">Admin Portal</CardTitle>
              <CardDescription className="text-rose-600 text-sm">Review and manage booking requests</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity py-6 text-rose-600 text-base border border-rose-600">
                Admin Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};
export default Index;