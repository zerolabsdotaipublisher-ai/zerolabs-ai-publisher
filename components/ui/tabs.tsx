"use client"

import * as React from "react"

const Tabs = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { defaultValue?: string }>(
  ({ className, defaultValue, children, ...props }, ref) => {
    const [value, setValue] = React.useState(defaultValue || "")
    return (
      <div ref={ref} className={className} data-state={value} {...props}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, { value, setValue })
          }
          return child
        })}
      </div>
    )
  }
)
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={`inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  )
)
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string; setValue?: (v: string) => void }
>(({ className, value, setValue, ...props }, ref) => {
  // Try to read value from context injected by Tabs via cloneElement
  const contextValue = (props as Record<string, unknown>)["value"] // current tab value
  const setContextValue = (props as Record<string, unknown>)["setValue"] // setter function
  const isActive = contextValue === value

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      onClick={() => {
        if (typeof setContextValue === "function") setContextValue(value)
        if (setValue) setValue(value)
      }}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow ${className || ''}`}
      {...props}
    />
  )
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, ...props }, ref) => {
  const contextValue = (props as Record<string, unknown>)["value"]
  if (contextValue !== value) return null

  return (
    <div
      ref={ref}
      role="tabpanel"
      data-state="active"
      className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className || ''}`}
      {...props}
    />
  )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
