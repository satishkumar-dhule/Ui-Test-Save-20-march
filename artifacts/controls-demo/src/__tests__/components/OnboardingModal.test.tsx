import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OnboardingModal } from "@/components/OnboardingModal";
import { techChannels, certChannels } from "@/data/channels";

const mockOnDone = vi.fn();

describe("OnboardingModal Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render the modal", () => {
      render(<OnboardingModal onDone={mockOnDone} />);

      expect(screen.getByTestId("onboarding-modal")).toBeInTheDocument();
    });

    it("should display welcome message", () => {
      render(<OnboardingModal onDone={mockOnDone} />);

      expect(screen.getByText("Welcome to DevPrep")).toBeInTheDocument();
    });

    it("should display description", () => {
      render(<OnboardingModal onDone={mockOnDone} />);

      expect(screen.getByText(/Choose the tech topics/)).toBeInTheDocument();
    });
  });

  describe("Channel Selection", () => {
    it("should pre-select JavaScript by default", () => {
      render(<OnboardingModal onDone={mockOnDone} />);

      const jsChannel = screen.getByTestId("onboarding-channel-javascript");
      expect(jsChannel).toBeInTheDocument();
    });

    it("should toggle channel selection", () => {
      render(<OnboardingModal onDone={mockOnDone} />);

      const jsChannel = screen.getByTestId("onboarding-channel-javascript");
      fireEvent.click(jsChannel);
      fireEvent.click(jsChannel);

      const doneButton = screen.getByTestId("onboarding-done-btn");
      expect(doneButton).toBeDisabled();
    });

    it("should allow selecting multiple channels", () => {
      render(<OnboardingModal onDone={mockOnDone} />);

      const jsChannel = screen.getByTestId("onboarding-channel-javascript");
      const reactChannel = screen.getByTestId("onboarding-channel-react");

      fireEvent.click(jsChannel);
      fireEvent.click(reactChannel);

      const doneButton = screen.getByTestId("onboarding-done-btn");
      expect(doneButton).toBeEnabled();
    });

    it("should display tech channels", () => {
      render(<OnboardingModal onDone={mockOnDone} />);

      expect(screen.getByText("Tech Topics")).toBeInTheDocument();

      techChannels.forEach((channel) => {
        expect(
          screen.getByTestId(`onboarding-channel-${channel.id}`),
        ).toBeInTheDocument();
      });
    });

    it("should display certification channels", () => {
      render(<OnboardingModal onDone={mockOnDone} />);

      expect(screen.getByText("Certifications")).toBeInTheDocument();

      certChannels.forEach((channel) => {
        expect(
          screen.getByTestId(`onboarding-channel-${channel.id}`),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Selection Counter", () => {
    it("should show selected count for tech channels", () => {
      render(<OnboardingModal onDone={mockOnDone} />);

      const reactChannel = screen.getByTestId("onboarding-channel-react");
      fireEvent.click(reactChannel);

      expect(screen.getByText("2 selected")).toBeInTheDocument();
    });

    it("should show selected count for certification channels", () => {
      render(<OnboardingModal onDone={mockOnDone} />);

      const awsChannel = screen.getByTestId("onboarding-channel-aws-saa");
      fireEvent.click(awsChannel);

      expect(screen.getByText("2 selected")).toBeInTheDocument();
    });

    it("should update tracks selected message", () => {
      render(<OnboardingModal onDone={mockOnDone} />);

      expect(screen.getByText("1 track selected")).toBeInTheDocument();

      const reactChannel = screen.getByTestId("onboarding-channel-react");
      fireEvent.click(reactChannel);

      expect(screen.getByText("2 tracks selected")).toBeInTheDocument();
    });

    it("should show zero selected message when nothing is selected", () => {
      render(<OnboardingModal onDone={mockOnDone} />);

      const jsChannel = screen.getByTestId("onboarding-channel-javascript");
      fireEvent.click(jsChannel);

      expect(screen.getByText(/Select at least one track/)).toBeInTheDocument();
    });
  });

  describe("Done Button", () => {
    it("should be disabled when no channels selected", () => {
      render(<OnboardingModal onDone={mockOnDone} />);

      const jsChannel = screen.getByTestId("onboarding-channel-javascript");
      fireEvent.click(jsChannel);
      fireEvent.click(jsChannel);

      const doneButton = screen.getByTestId("onboarding-done-btn");
      expect(doneButton).toBeDisabled();
    });

    it("should be enabled when at least one channel selected", () => {
      render(<OnboardingModal onDone={mockOnDone} />);

      const doneButton = screen.getByTestId("onboarding-done-btn");
      expect(doneButton).toBeEnabled();
    });

    it("should call onDone with selected channels", () => {
      render(<OnboardingModal onDone={mockOnDone} />);

      const reactChannel = screen.getByTestId("onboarding-channel-react");
      fireEvent.click(reactChannel);

      const doneButton = screen.getByTestId("onboarding-done-btn");
      fireEvent.click(doneButton);

      expect(mockOnDone).toHaveBeenCalledWith(
        expect.objectContaining(new Set(["javascript", "react"])),
      );
    });

    it("should include initial selected channels", () => {
      render(
        <OnboardingModal
          onDone={mockOnDone}
          initialSelected={new Set(["algorithms", "aws-saa"])}
        />,
      );

      const doneButton = screen.getByTestId("onboarding-done-btn");
      fireEvent.click(doneButton);

      expect(mockOnDone).toHaveBeenCalledWith(
        expect.objectContaining(new Set(["algorithms", "aws-saa"])),
      );
    });
  });

  describe("Channel Card Display", () => {
    it("should display channel name", () => {
      render(<OnboardingModal onDone={mockOnDone} />);

      expect(screen.getByText("JavaScript")).toBeInTheDocument();
    });

    it("should display channel description", () => {
      render(<OnboardingModal onDone={mockOnDone} />);

      const jsChannel = techChannels.find((c) => c.id === "javascript");
      expect(screen.getByText(jsChannel!.description)).toBeInTheDocument();
    });

    it("should display channel emoji", () => {
      render(<OnboardingModal onDone={mockOnDone} />);

      const jsChannel = techChannels.find((c) => c.id === "javascript");
      expect(screen.getByText(jsChannel!.emoji)).toBeInTheDocument();
    });

    it("should display certification code for cert channels", () => {
      render(<OnboardingModal onDone={mockOnDone} />);

      const awsChannel = certChannels.find((c) => c.id === "aws-saa");
      expect(screen.getByText(awsChannel!.certCode!)).toBeInTheDocument();
    });
  });
});
