import { SmartSpendApp } from "@/components/smart-spend-app"
import { useLocalNotifications } from "@/hooks/use-local-notifications"

const Index = () => {
  // Initialize local notifications
  useLocalNotifications();
  
  return <SmartSpendApp />
};

export default Index;
