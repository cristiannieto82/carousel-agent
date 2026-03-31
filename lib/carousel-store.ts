import type { Carousel } from './types'

const store = new Map<string, Carousel>()
let _id = 0

export function generateId(): string {
  return `car_${++_id}_${Date.now()}`
}

export function getCarousel(id: string): Carousel | undefined {
  return store.get(id)
}

export function setCarousel(carousel: Carousel): void {
  store.set(carousel.id, carousel)
}

export function getLatestCarousel(): Carousel | undefined {
  const entries = Array.from(store.values())
  return entries[entries.length - 1]
}
