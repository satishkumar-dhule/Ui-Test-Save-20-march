import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, Info, CheckCircle, Bold, Italic, Underline } from "lucide-react";

export default function ControlsPage() {
  const [textValue, setTextValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [textareaValue, setTextareaValue] = useState("");
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [checkbox2Checked, setCheckbox2Checked] = useState(true);
  const [radioValue, setRadioValue] = useState("option1");
  const [switchOn, setSwitchOn] = useState(false);
  const [switch2On, setSwitch2On] = useState(true);
  const [sliderValue, setSliderValue] = useState([50]);
  const [rangeValue, setRangeValue] = useState([20, 80]);
  const [selectValue, setSelectValue] = useState("");
  const [progressValue] = useState(65);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("tab1");
  const [boldActive, setBoldActive] = useState(false);
  const [italicActive, setItalicActive] = useState(false);
  const [underlineActive, setUnderlineActive] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitResult(
      `Submitted: name="${textValue}", email="${emailValue}", radio="${radioValue}", select="${selectValue}", slider=${sliderValue[0]}`
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
            UI Controls Demo
          </h1>
          <p className="mt-2 text-gray-600">
            A comprehensive showcase of all UI controls and interactive elements.
          </p>
        </div>

        <Separator />

        {/* Badges */}
        <Card data-testid="badges-section">
          <CardHeader>
            <CardTitle>Badges</CardTitle>
            <CardDescription>Status indicators and labels.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Badge data-testid="badge-default">Default</Badge>
            <Badge variant="secondary" data-testid="badge-secondary">Secondary</Badge>
            <Badge variant="outline" data-testid="badge-outline">Outline</Badge>
            <Badge variant="destructive" data-testid="badge-destructive">Destructive</Badge>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card data-testid="alerts-section">
          <CardHeader>
            <CardTitle>Alerts</CardTitle>
            <CardDescription>Informational messages for the user.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert data-testid="alert-info">
              <Info className="h-4 w-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>This is an informational alert message.</AlertDescription>
            </Alert>
            <Alert variant="destructive" data-testid="alert-error">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Something went wrong. Please try again.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Form Controls */}
        <Card data-testid="form-section">
          <CardHeader>
            <CardTitle>Form Controls</CardTitle>
            <CardDescription>Inputs, selects, and form elements.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Text Input */}
              <div className="space-y-2">
                <Label htmlFor="text-input">Full Name</Label>
                <Input
                  id="text-input"
                  data-testid="text-input"
                  type="text"
                  placeholder="Enter your name"
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                />
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email-input">Email Address</Label>
                <Input
                  id="email-input"
                  data-testid="email-input"
                  type="email"
                  placeholder="you@example.com"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password-input">Password</Label>
                <Input
                  id="password-input"
                  data-testid="password-input"
                  type="password"
                  placeholder="••••••••"
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                />
              </div>

              {/* Textarea */}
              <div className="space-y-2">
                <Label htmlFor="textarea-input">Message</Label>
                <Textarea
                  id="textarea-input"
                  data-testid="textarea-input"
                  placeholder="Write your message here..."
                  value={textareaValue}
                  onChange={(e) => setTextareaValue(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Select */}
              <div className="space-y-2">
                <Label htmlFor="select-input">Country</Label>
                <Select value={selectValue} onValueChange={setSelectValue}>
                  <SelectTrigger id="select-input" data-testid="select-trigger">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us" data-testid="select-option-us">United States</SelectItem>
                    <SelectItem value="uk" data-testid="select-option-uk">United Kingdom</SelectItem>
                    <SelectItem value="ca" data-testid="select-option-ca">Canada</SelectItem>
                    <SelectItem value="au" data-testid="select-option-au">Australia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <Label>Preferences</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="checkbox1"
                    data-testid="checkbox-1"
                    checked={checkboxChecked}
                    onCheckedChange={(v) => setCheckboxChecked(!!v)}
                  />
                  <Label htmlFor="checkbox1" className="cursor-pointer">
                    Subscribe to newsletter
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="checkbox2"
                    data-testid="checkbox-2"
                    checked={checkbox2Checked}
                    onCheckedChange={(v) => setCheckbox2Checked(!!v)}
                  />
                  <Label htmlFor="checkbox2" className="cursor-pointer">
                    Accept terms and conditions
                  </Label>
                </div>
              </div>

              {/* Radio Group */}
              <div className="space-y-3">
                <Label>Plan</Label>
                <RadioGroup
                  data-testid="radio-group"
                  value={radioValue}
                  onValueChange={setRadioValue}
                  className="space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="option1" id="radio1" data-testid="radio-1" />
                    <Label htmlFor="radio1" className="cursor-pointer">Free</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="option2" id="radio2" data-testid="radio-2" />
                    <Label htmlFor="radio2" className="cursor-pointer">Pro</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="option3" id="radio3" data-testid="radio-3" />
                    <Label htmlFor="radio3" className="cursor-pointer">Enterprise</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Switches */}
              <div className="space-y-3">
                <Label>Settings</Label>
                <div className="flex items-center gap-3">
                  <Switch
                    id="switch1"
                    data-testid="switch-1"
                    checked={switchOn}
                    onCheckedChange={setSwitchOn}
                  />
                  <Label htmlFor="switch1" className="cursor-pointer">
                    Dark mode {switchOn ? "(ON)" : "(OFF)"}
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="switch2"
                    data-testid="switch-2"
                    checked={switch2On}
                    onCheckedChange={setSwitch2On}
                  />
                  <Label htmlFor="switch2" className="cursor-pointer">
                    Email notifications {switch2On ? "(ON)" : "(OFF)"}
                  </Label>
                </div>
              </div>

              {/* Slider */}
              <div className="space-y-3">
                <Label>Volume: {sliderValue[0]}</Label>
                <Slider
                  data-testid="slider"
                  min={0}
                  max={100}
                  step={1}
                  value={sliderValue}
                  onValueChange={setSliderValue}
                  className="w-full"
                />
              </div>

              {/* Range Slider */}
              <div className="space-y-3">
                <Label>Price Range: ${rangeValue[0]} – ${rangeValue[1]}</Label>
                <Slider
                  data-testid="range-slider"
                  min={0}
                  max={100}
                  step={5}
                  value={rangeValue}
                  onValueChange={setRangeValue}
                  className="w-full"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <Button type="submit" data-testid="submit-button">Submit Form</Button>
                <Button
                  type="button"
                  variant="outline"
                  data-testid="reset-button"
                  onClick={() => {
                    setTextValue("");
                    setEmailValue("");
                    setPasswordValue("");
                    setTextareaValue("");
                    setSelectValue("");
                    setCheckboxChecked(false);
                    setRadioValue("option1");
                    setSliderValue([50]);
                    setSubmitResult(null);
                  }}
                >
                  Reset
                </Button>
              </div>

              {/* Submit Result */}
              {submitResult && (
                <Alert data-testid="submit-result">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Form Submitted</AlertTitle>
                  <AlertDescription>{submitResult}</AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Button Variants */}
        <Card data-testid="buttons-section">
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Different button styles and states.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button data-testid="btn-default">Default</Button>
            <Button variant="secondary" data-testid="btn-secondary">Secondary</Button>
            <Button variant="outline" data-testid="btn-outline">Outline</Button>
            <Button variant="ghost" data-testid="btn-ghost">Ghost</Button>
            <Button variant="destructive" data-testid="btn-destructive">Destructive</Button>
            <Button variant="link" data-testid="btn-link">Link</Button>
            <Button disabled data-testid="btn-disabled">Disabled</Button>
          </CardContent>
        </Card>

        {/* Toggle Buttons */}
        <Card data-testid="toggles-section">
          <CardHeader>
            <CardTitle>Toggle Buttons</CardTitle>
            <CardDescription>Stateful toggle controls.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Toggle
                data-testid="toggle-bold"
                pressed={boldActive}
                onPressedChange={setBoldActive}
                aria-label="Bold"
              >
                <Bold className="h-4 w-4" />
                Bold
              </Toggle>
              <Toggle
                data-testid="toggle-italic"
                pressed={italicActive}
                onPressedChange={setItalicActive}
                aria-label="Italic"
              >
                <Italic className="h-4 w-4" />
                Italic
              </Toggle>
              <Toggle
                data-testid="toggle-underline"
                pressed={underlineActive}
                onPressedChange={setUnderlineActive}
                aria-label="Underline"
              >
                <Underline className="h-4 w-4" />
                Underline
              </Toggle>
            </div>
            <p className="mt-3 text-sm text-gray-500" data-testid="toggle-status">
              Active: {[boldActive && "Bold", italicActive && "Italic", underlineActive && "Underline"].filter(Boolean).join(", ") || "None"}
            </p>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card data-testid="progress-section">
          <CardHeader>
            <CardTitle>Progress Bar</CardTitle>
            <CardDescription>Visual progress indicator.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Upload Progress ({progressValue}%)</Label>
              <Progress value={progressValue} data-testid="progress-bar" />
            </div>
            <div>
              <Label className="mb-2 block">Complete (100%)</Label>
              <Progress value={100} data-testid="progress-complete" />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card data-testid="tabs-section">
          <CardHeader>
            <CardTitle>Tabs</CardTitle>
            <CardDescription>Tabbed navigation for content areas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList data-testid="tabs-list">
                <TabsTrigger value="tab1" data-testid="tab-1">Account</TabsTrigger>
                <TabsTrigger value="tab2" data-testid="tab-2">Security</TabsTrigger>
                <TabsTrigger value="tab3" data-testid="tab-3">Billing</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1" data-testid="tab-content-1">
                <p className="text-sm text-gray-600 pt-4">Manage your account settings and preferences here.</p>
              </TabsContent>
              <TabsContent value="tab2" data-testid="tab-content-2">
                <p className="text-sm text-gray-600 pt-4">Update your password and manage security options.</p>
              </TabsContent>
              <TabsContent value="tab3" data-testid="tab-content-3">
                <p className="text-sm text-gray-600 pt-4">View and manage your billing information and subscriptions.</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Dialog / Modal */}
        <Card data-testid="dialog-section">
          <CardHeader>
            <CardTitle>Dialog / Modal</CardTitle>
            <CardDescription>Popup dialogs for user interactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="open-dialog-button">Open Dialog</Button>
              </DialogTrigger>
              <DialogContent data-testid="dialog-content">
                <DialogHeader>
                  <DialogTitle data-testid="dialog-title">Confirm Action</DialogTitle>
                  <DialogDescription data-testid="dialog-description">
                    Are you sure you want to perform this action? This cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    data-testid="dialog-cancel-button"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    data-testid="dialog-confirm-button"
                    onClick={() => setDialogOpen(false)}
                  >
                    Confirm
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Tooltip */}
        <Card data-testid="tooltip-section">
          <CardHeader>
            <CardTitle>Tooltips</CardTitle>
            <CardDescription>Contextual help on hover.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" data-testid="tooltip-trigger-1">Hover me</Button>
              </TooltipTrigger>
              <TooltipContent data-testid="tooltip-content-1">
                <p>This is a helpful tooltip</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="tooltip-trigger-2">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent data-testid="tooltip-content-2">
                <p>Information tooltip</p>
              </TooltipContent>
            </Tooltip>
          </CardContent>
        </Card>

        <div className="pb-10 text-center text-sm text-gray-400">
          UI Controls Demo — All controls functional and testable
        </div>
      </div>
    </div>
  );
}
