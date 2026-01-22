import { MainLayout } from "@/components/layout/MainLayout";
import { TransportProvider } from "@/services/transport";
import { useAutoConnect } from "@/hooks/useAutoConnect";
import { useZoom } from "@/hooks/useZoom";
import { useTheme } from "@/hooks/useTheme";
import { InstallPrompt } from "@/components/common/InstallPrompt";
import { LocalServerDetectedDialog } from "@/components/common/LocalServerDetectedDialog";

function AppContent() {
  // Auto-connect to backend when app loads
  useAutoConnect();

  // Enable Cmd+/Cmd- zoom shortcuts
  useZoom();

  // Apply theme to document
  useTheme();

  return (
    <>
      <MainLayout />
      <InstallPrompt />
      <LocalServerDetectedDialog />
    </>
  );
}

function App() {
  return (
    <TransportProvider>
      <AppContent />
    </TransportProvider>
  );
}

export default App;
