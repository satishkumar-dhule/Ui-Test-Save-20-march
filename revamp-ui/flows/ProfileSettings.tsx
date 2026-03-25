import React, { useState } from "react";
import Shell from "../src/Shell";
import Card from "../src/Card";
import Input from "../src/Input";
import Button from "../src/Button";

export const ProfileSettingsFlow: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  return (
    <Shell title="Profile & Settings">
      <Card title="Your Profile">
        <Input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div style={{ height: 8 }} />
        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
        />
        <div style={{ height: 8 }} />
        <Button label="Save" onClick={() => alert("Saved")} />
      </Card>
    </Shell>
  );
};

export default ProfileSettingsFlow;
