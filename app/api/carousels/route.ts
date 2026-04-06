import { getAllCarousels, deleteCarousel } from '@/lib/carousel-store'
// @ts-ignore
import { renderSlideHTML } from '../../../shared/renderers'
// @ts-ignore
import { DEFAULT_BRANDS, deriveColors, makeBrand } from '../../../shared/brands'

function getBrand(brandId: string) {
  return DEFAULT_BRANDS.find((b: any) => b.id === brandId) || DEFAULT_BRANDS[0]
}

export async function GET() {
  const carousels = getAllCarousels()

  const result = carousels.map(c => {
    const brand = getBrand(c.brandId)
    // Only render first slide as thumbnail for performance
    const thumbnail = c.slides.length > 0
      ? renderSlideHTML(c.slides[0], 0, c.slides.length, brand)
      : null

    return {
      id: c.id,
      name: c.name,
      brandId: c.brandId,
      brandName: brand.name,
      slideCount: c.slides.length,
      hasCaption: !!c.caption,
      thumbnail,
      createdAt: c.createdAt,
    }
  })

  return Response.json({ carousels: result })
}

export async function DELETE(req: Request) {
  const { carouselId } = await req.json()
  const deleted = deleteCarousel(carouselId)
  return Response.json({ deleted })
}
