import { Nav } from "~/components/landing/nav";
import { Hero } from "~/components/landing/hero";
import { Studio } from "~/components/landing/studio";
import { StudioNews } from "~/components/landing/studio-news";
import { ContactCTA } from "~/components/landing/contact-cta";
import { Footer } from "~/components/landing/footer";

/**
 * Page structure matching The Line Studio's architecture:
 *
 * <main>
 *   <Nav />                    (fixed z-60, mix-blend-difference)
 *   <Hero />                   (sticky video + rotating overlay + project cards)
 *   <Studio />                 (scroll-animated entrance: scrape engine + partners)
 *   <div bg-flare>             (RED wrapper — footer reveal effect)
 *     <StudioNews />           (dispatches/news cards — white bg, z-10)
 *     <ContactCTA />           (scroll-animated tilt — white bg, z-20)
 *     <Footer />               (sticky bottom-0 z-0 — full Spider-Man artwork bg + text on top)
 *   </div>
 * </main>
 */
export default function HomePage() {
    return (
        <main className="relative min-h-screen bg-void text-off-white antialiased [text-rendering:optimizeLegibility] selection:bg-flare selection:text-off-white overflow-x-clip">
            <Nav />
            <Hero />
            <Studio />
            <div className="relative overflow-clip bg-flare">
                <StudioNews />
                <ContactCTA />
                <Footer />
            </div>
        </main>
    );
}
