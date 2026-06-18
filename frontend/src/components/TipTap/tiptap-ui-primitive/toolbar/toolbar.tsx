import { forwardRef, useCallback, useEffect, useRef, useState } from "react"
import { Separator } from "@/components/TipTap/tiptap-ui-primitive/separator"
import "@/components/TipTap/tiptap-ui-primitive/toolbar/toolbar.scss"
import { cn } from "@/lib/tiptap-utils"
import { useMenuNavigation } from "@/hooks/useMenuNavigation"
import { useComposedRef } from "@/hooks/useComposedRef"
import { useIsMobile, useIsSmallScreen } from "@/hooks"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6"

type BaseProps = React.HTMLAttributes<HTMLDivElement>

interface ToolbarProps extends BaseProps {
  variant?: "floating" | "fixed"
}

const useToolbarNavigation = (toolbarRef: React.RefObject<HTMLDivElement | null>) => {
  const [items, setItems] = useState<HTMLElement[]>([])

  const collectItems = useCallback(() => {
    if (!toolbarRef.current) return []
    return Array.from(
      toolbarRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [role="button"]:not([disabled]), [tabindex="0"]:not([disabled])'
      )
    )
  }, [toolbarRef])

  useEffect(() => {
    const toolbar = toolbarRef.current
    if (!toolbar) return
    const updateItems = () => setItems(collectItems())
    updateItems()
    const observer = new MutationObserver(updateItems)
    observer.observe(toolbar, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [collectItems, toolbarRef])

  useEffect(() => {
    items.forEach(item => item.setAttribute("tabindex", "-1"))
  }, [items])

  const { selectedIndex } = useMenuNavigation<HTMLElement>({
    containerRef: toolbarRef,
    items,
    orientation: "horizontal",
    onSelect: (el) => el.click(),
    autoSelectFirstItem: false,
  })

  useEffect(() => {
    const toolbar = toolbarRef.current
    if (!toolbar) return
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (toolbar.contains(target)) target.setAttribute("data-focus-visible", "true")
    }
    const handleBlur = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (toolbar.contains(target)) target.removeAttribute("data-focus-visible")
    }
    toolbar.addEventListener("focus", handleFocus, true)
    toolbar.addEventListener("blur", handleBlur, true)
    return () => {
      toolbar.removeEventListener("focus", handleFocus, true)
      toolbar.removeEventListener("blur", handleBlur, true)
    }
  }, [toolbarRef])

  useEffect(() => {
    if (selectedIndex !== undefined && items[selectedIndex]) {
      items[selectedIndex].focus()
    }
  }, [selectedIndex, items])

  const handleToolbarFocus = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      items[0]?.focus()
    }
  }, [items])

  return { handleToolbarFocus }
}

const useScrollChevron = (scrollRef: React.RefObject<HTMLDivElement | null>) => {
  const [showRight, setShowRight] = useState(false)
  const [showLeft, setShowLeft] = useState(false)

  const checkOverflow = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setShowRight(el.scrollWidth > el.clientWidth && el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    setShowLeft(el.scrollLeft > 4)
  }, [scrollRef])

  useEffect(() => {
    const raf = requestAnimationFrame(checkOverflow)
    const el = scrollRef.current
    if (!el) return

    el.addEventListener("scroll", checkOverflow)
    const resizeObserver = new ResizeObserver(checkOverflow)
    resizeObserver.observe(el)

    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener("scroll", checkOverflow)
      resizeObserver.disconnect()
    }
  }, [checkOverflow])

  const scrollRight = () => scrollRef.current?.scrollBy({ left: 80, behavior: "smooth" })
  const scrollLeft = () => scrollRef.current?.scrollBy({ left: -80, behavior: "smooth" })

  return { showRight, showLeft, scrollRight, scrollLeft }
}
export const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(
  ({ children, className, variant = "fixed", ...props }, ref) => {
    const toolbarRef = useRef<HTMLDivElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const composedRef = useComposedRef(toolbarRef, ref)
    const isMobile = useIsMobile()
    const isSmallScreen = useIsSmallScreen(480)
    const mobileMode = isMobile && isSmallScreen
    useToolbarNavigation(toolbarRef)
    const { showRight, showLeft, scrollRight, scrollLeft } = useScrollChevron(scrollRef)

    return (
      <div
        ref={composedRef}
        role="toolbar"
        aria-label="toolbar"
        data-variant={variant}
        data-mobile={mobileMode}
        className={cn("tiptap-toolbar", className)}
        {...props}
      >
        {showLeft && (
          <button type="button" className="tiptap-toolbar-chevron tiptap-toolbar-chevron--left" onClick={scrollLeft} tabIndex={-1} aria-hidden>
            <FaChevronLeft size={10} />
          </button>
        )}
        <div ref={scrollRef} className="tiptap-toolbar-scroll">
          {children}
        </div>
        {showRight && (
          <button type="button" className="tiptap-toolbar-chevron tiptap-toolbar-chevron--right" onClick={scrollRight} tabIndex={-1} aria-hidden>
            <FaChevronRight size={10} />
          </button>
        )}
      </div>
    )
  }
)
Toolbar.displayName = "Toolbar"

export const ToolbarGroup = forwardRef<HTMLDivElement, BaseProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} role="group" className={cn("tiptap-toolbar-group", className)} {...props}>
      {children}
    </div>
  )
)
ToolbarGroup.displayName = "ToolbarGroup"

export const ToolbarSeparator = forwardRef<HTMLDivElement, BaseProps>(
  ({ ...props }, ref) => <Separator ref={ref} orientation="vertical" decorative {...props} />
)
ToolbarSeparator.displayName = "ToolbarSeparator"
