import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { cleanupVulnerableData, verifySafeStorage } from "./lib/securityCleanup";

// SECURITY: Clean up vulnerable data on app startup BEFORE anything else loads
console.log('🔒 Shiphy Security: Initializing security checks...');
cleanupVulnerableData();
const isStorageSafe = verifySafeStorage();

if (!isStorageSafe) {
  console.error('❌ SECURITY ALERT: Dangerous data detected in browser storage!');
  console.error('Please clear your browser cache and localStorage.');
}

createRoot(document.getElementById("root")!).render(<App />);
