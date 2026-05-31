/**
 * Tests for LandingPage scene.
 *
 * LandingPage is shown to unauthenticated users.
 * Contains hero section, image slider, and CTA links.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import LandingPage from '../../scenes/LandingPage/LandingPage';

// Mock image imports
vi.mock('../../assets/logo.png', () => ({ default: 'logo.png' }));
vi.mock('../../assets/arrow.png', () => ({ default: 'arrow.png' }));

describe('LandingPage scene', () => {
    function renderLanding() {
        return render(
            <MemoryRouter>
                <LandingPage />
            </MemoryRouter>
        );
    }

    it('should render hero title "Train Smarter / Reach Your Goals"', () => {
        // GIVEN: LandingPage renders
        renderLanding();

        // WHEN: Looking at the hero section
        // THEN: Title text is visible
        expect(screen.getByText(/Train Smarter/)).toBeInTheDocument();
        expect(screen.getByText(/Reach Your Goals/)).toBeInTheDocument();
    });

    it('should render "Get Started" CTA link pointing to /login', () => {
        // GIVEN: LandingPage renders
        renderLanding();

        // WHEN: Looking at the CTA area
        // THEN: "Get Started" link is visible
        const ctaLink = screen.getByText('Get Started');
        expect(ctaLink).toBeInTheDocument();
        expect(ctaLink.closest('a')).toHaveAttribute('href', '/login');
    });

    it('should render logo image', () => {
        // GIVEN: LandingPage renders
        renderLanding();

        // WHEN: Looking for the logo
        // THEN: Logo image is present
        expect(screen.getByAltText('Gym Planner Logo')).toBeInTheDocument();
    });

    it('should render slider images', () => {
        // GIVEN: LandingPage renders
        const { container } = renderLanding();

        // WHEN: Looking at the slider
        // THEN: Slider images are rendered (14 = 7 original + 7 duplicated)
        const slides = container.querySelectorAll('div[class*="slide"] img');
        expect(slides.length).toBe(14);
    });

    it('should render "Join over 10 happy members" badge', () => {
        // GIVEN: LandingPage renders
        renderLanding();

        // WHEN: Looking at the badges
        // THEN: Badge text is visible
        expect(screen.getByText('Join over 10 happy members')).toBeInTheDocument();
    });

    it('should render "It\'s free" note', () => {
        // GIVEN: LandingPage renders
        renderLanding();

        // WHEN: Looking at CTA notes
        // THEN: "It's free" note is visible
        expect(screen.getByText("It's free")).toBeInTheDocument();
    });

    it('should render "It\'s 10/10" note', () => {
        // GIVEN: LandingPage renders
        renderLanding();

        // WHEN: Looking at CTA notes
        // THEN: Rating note is visible
        expect(screen.getByText("It's 10/10")).toBeInTheDocument();
    });

    it('should render hero description text', () => {
        // GIVEN: LandingPage renders
        renderLanding();

        // WHEN: Looking at description
        // THEN: Description text is present
        expect(screen.getByText(/Find workout buddies/)).toBeInTheDocument();
    });
});
