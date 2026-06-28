import { CheckCircle2, Truck } from "lucide-react";
import { Container } from "./Container";
import { MButton } from "./MButton";

const POINTS = [
  "Pickup at your origin — home, office or supplier",
  "One contact across air, ocean & last-mile",
  "Customs & duties handled end to end",
  "Right to the recipient's door, with proof of delivery",
];

/**
 * Door-to-door delivery band — features the courier handing over a parcel.
 */
export function DeliveryBand() {
  return (
    <section className="overflow-hidden bg-navy-50">
      <Container className="py-16 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Courier image */}
          <div className="order-last lg:order-first">
            <div className="relative mx-auto max-w-md overflow-hidden rounded-3xl bg-white shadow-lift">
              <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-brand-100/60 blur-2xl" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/delivery-courier.jpg"
                alt="Liberty courier in a black uniform smiling and handing over a cardboard parcel"
                className="relative mx-auto w-full max-w-sm"
                loading="lazy"
              />
            </div>
          </div>

          {/* Copy */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
              <Truck className="h-3.5 w-3.5" /> Door-to-Door Delivery
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
              From our hands to your recipient&apos;s door
            </h2>
            <p className="mt-4 text-lg text-navy-500">
              Skip the terminals and the guesswork. We collect at the origin, manage every handover,
              clear customs and deliver right to the door — and both you and your recipient get
              tracking the whole way.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {POINTS.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-navy-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <MButton href="/contact" variant="primary" size="lg">
                Book a delivery
              </MButton>
              <MButton href="/track" variant="outline" size="lg">
                Track a shipment
              </MButton>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
