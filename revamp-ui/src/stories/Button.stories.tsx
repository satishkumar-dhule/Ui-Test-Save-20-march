import React from "react";
import Button from "../Button";

export default {
  title: "Components/Button",
  component: Button,
};

export const Primary = {
  args: {
    label: "Primary Button",
    variant: "primary",
  },
};

export const Secondary = {
  args: {
    label: "Secondary Button",
    variant: "secondary",
  },
};

export const Disabled = {
  args: {
    label: "Disabled Button",
    variant: "primary",
    disabled: true,
  },
};
