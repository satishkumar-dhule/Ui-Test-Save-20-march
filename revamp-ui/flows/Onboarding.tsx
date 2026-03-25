import React, { useState } from "react";
import Button from "../src/Button";
import Input from "../src/Input";
import Card from "../src/Card";
import Shell from "../src/Shell";

export const OnboardingFlow: React.FC = () => {
  const [name, setName] = useState("");
  return (
    <Shell title="Onboarding">
      <Card title="Welcome to Revamp UI" className="onboard-card">
        <p>Let's set up your profile to personalize the experience.</p>
        <Input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div style={{ height: 8 }} />
        <Button
          label="Continue"
          onClick={() => alert(`Hi ${name || "there"}!`)}
        />
      </Card>
    </Shell>
  );
};

export default OnboardingFlow;
