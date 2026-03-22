import React from "react";
import { vi } from "vitest";

export const useLocation = vi.fn(() => ["/", vi.fn()]);
export const useRoute = vi.fn(() => [false, {}]);

export const Link: React.FC<any> = ({ children, href, ...props }) => 
  React.createElement("a", { href, ...props }, children);

export const Route: React.FC<any> = ({ component: Component, ...props }) => 
  Component ? React.createElement(Component, props) : null;

export const Switch: React.FC<any> = ({ children }) => children;
export const Redirect: React.FC<any> = ({ to }) => null;
export const Router: React.FC<any> = ({ children }) => children;

export default {
  useLocation,
  useRoute,
  Link,
  Route,
  Switch,
  Redirect,
  Router,
};