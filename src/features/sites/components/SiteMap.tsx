"use client"

import React, { useEffect, useRef, useState, useMemo } from "react"
import { parseGpsCoordinates } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, Zap, Fuel, AlertTriangle, X, Layers } from "lucide-react"

// ---------- Types ---------------------------------------------------------

interface Generator {
  id: number
  genId: string
  model: string | null
  capacity: string | null
  capacityKVA: number | null
  serialNumber: string | null
  lastRunningHours: number | null
}

interface SiteWithLocation {
  id: number
  siteId: string
  name: string
  region: string | null
  gpsCoordinates: string | null
  tankerCapacity: number | null
  dgCapacity: string | null
  dgType: string | null
  generator: Generator | null
}

interface Props {
  sites: SiteWithLocation[]
}

// ---------- Helpers -------------------------------------------------------

/** Sites that have valid, parseable GPS coordinates */
function sitesWithCoords(sites: SiteWithLocation[]) {
  return sites.flatMap((s) => {
    const coords = parseGpsCoordinates(s.gpsCoordinates)
    return coords ? [{ ...s, coords }] : []
  })
}

// ---------- Component -----------------------------------------------------

export function SiteMap({ sites }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<import("leaflet").Map | null>(null)
  const markersRef = useRef<Map<number, import("leaflet").Marker>>(new Map())

  const [search, setSearch] = useState("")
  const [selectedRegion, setSelectedRegion] = useState<string>("ALL")
  const [selectedSite, setSelectedSite] = useState<SiteWithLocation | null>(null)
  const [mapReady, setMapReady] = useState(false)

  // All regions for filter dropdown
  const regions = useMemo(() => {
    const set = new Set(sites.map((s) => s.region).filter(Boolean) as string[])
    return ["ALL", ...Array.from(set).sort()]
  }, [sites])

  // Sites that have real coordinates
  const mappableSites = useMemo(() => sitesWithCoords(sites), [sites])

  // Sites without coordinates
  const unmappedSites = useMemo(
    () => sites.filter((s) => !parseGpsCoordinates(s.gpsCoordinates)),
    [sites]
  )

  // Filtered list for the sidebar search panel
  const filteredList = useMemo(() => {
    const q = search.toLowerCase()
    return mappableSites.filter((s) => {
      const matchRegion = selectedRegion === "ALL" || s.region === selectedRegion
      const matchSearch =
        !q ||
        s.siteId.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.region || "").toLowerCase().includes(q)
      return matchRegion && matchSearch
    })
  }, [mappableSites, search, selectedRegion])

  // ---------- Leaflet initialization (runs once on mount) -----------------

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return

    // Leaflet must be imported dynamically because it accesses `window`
    let L: typeof import("leaflet")
    let mounted = true

    ;(async () => {
      L = (await import("leaflet")).default

      // Fix the default marker icon paths broken by webpack
      // @ts-expect-error – _getIconUrl is internal to Leaflet
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      if (!mounted || !mapRef.current) return

      // Centre on Addis Ababa by default
      const map = L.map(mapRef.current, {
        center: [9.0227, 38.7469],
        zoom: 11,
        zoomControl: true,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      leafletMap.current = map
      setMapReady(true)
    })()

    return () => {
      mounted = false
    }
  }, [])

  // ---------- Sync markers whenever mappable sites or filter changes -------

  useEffect(() => {
    if (!mapReady || !leafletMap.current) return

    let L: typeof import("leaflet")

    ;(async () => {
      L = (await import("leaflet")).default
      const map = leafletMap.current!
      const existingIds = new Set(markersRef.current.keys())

      // Build custom icons
      const defaultIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:28px;height:28px;border-radius:50% 50% 50% 0;
          background:#65a30d;border:2px solid #fff;
          transform:rotate(-45deg);
          box-shadow:0 2px 6px rgba(0,0,0,0.35);
        "></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -30],
      })

      const selectedIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:36px;height:36px;border-radius:50% 50% 50% 0;
          background:#dc2626;border:3px solid #fff;
          transform:rotate(-45deg);
          box-shadow:0 3px 10px rgba(0,0,0,0.45);
        "></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38],
      })

      for (const locatedSite of mappableSites) {
        const { lat, lng } = locatedSite.coords
        const isSelected = selectedSite?.id === locatedSite.id
        const isFiltered = filteredList.some((f) => f.id === locatedSite.id)

        if (markersRef.current.has(locatedSite.id)) {
          // Update existing marker icon & opacity
          const marker = markersRef.current.get(locatedSite.id)!
          marker.setIcon(isSelected ? selectedIcon : defaultIcon)
          marker.setOpacity(isFiltered || isSelected ? 1 : 0.3)
          existingIds.delete(locatedSite.id)
        } else {
          // Create new marker
          const marker = L.marker([lat, lng], {
            icon: isSelected ? selectedIcon : defaultIcon,
            opacity: isFiltered ? 1 : 0.3,
          })

          marker.bindTooltip(
            `<strong>${locatedSite.siteId}</strong> — ${locatedSite.name}`,
            { direction: "top", offset: [0, -30] }
          )

          marker.on("click", () => {
            setSelectedSite(locatedSite)
          })

          marker.addTo(map)
          markersRef.current.set(locatedSite.id, marker)
        }
      }

      // Remove markers for sites that no longer exist
      for (const staleId of existingIds) {
        const marker = markersRef.current.get(staleId)
        marker?.remove()
        markersRef.current.delete(staleId)
      }
    })()
  }, [mapReady, mappableSites, filteredList, selectedSite])

  // ---------- Fly to selected site ----------------------------------------

  useEffect(() => {
    if (!mapReady || !leafletMap.current || !selectedSite) return
    const coords = parseGpsCoordinates(selectedSite.gpsCoordinates)
    if (!coords) return
    leafletMap.current.flyTo([coords.lat, coords.lng], 15, { duration: 0.8 })
  }, [selectedSite, mapReady])

  // ---------- Fit map to filtered set when filter changes -----------------

  useEffect(() => {
    if (!mapReady || !leafletMap.current || filteredList.length === 0) return

    ;(async () => {
      const L = (await import("leaflet")).default
      const bounds = L.latLngBounds(
        filteredList.map((s) => [s.coords.lat, s.coords.lng])
      )
      if (bounds.isValid()) {
        leafletMap.current!.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 })
      }
    })()
  }, [mapReady, filteredList])

  // ---------- Render --------------------------------------------------------

  return (
    <div className="flex h-full w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
      {/* ── Left sidebar ── */}
      <div className="w-80 shrink-0 flex flex-col border-r border-slate-200 bg-white z-10">
        {/* Header */}
        <div className="bg-lime-600 p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="h-4 w-4" />
            <h2 className="font-bold uppercase tracking-tight text-sm">Site Map</h2>
          </div>
          <p className="text-lime-100 text-xs">
            {mappableSites.length} of {sites.length} sites mapped
          </p>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Search site ID or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm border-gray-200 focus:ring-lime-500"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Region filter */}
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="mt-2 w-full h-8 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-lime-500"
          >
            {regions.map((r) => (
              <option key={r} value={r}>
                {r === "ALL" ? "All regions" : r}
              </option>
            ))}
          </select>
        </div>

        {/* Site list */}
        <div className="flex-1 overflow-y-auto">
          {filteredList.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400 italic">
              No mapped sites match your search.
            </div>
          ) : (
            filteredList.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSite(s)}
                className={`w-full text-left px-4 py-2.5 border-b border-slate-50 hover:bg-lime-50 transition-colors ${
                  selectedSite?.id === s.id
                    ? "bg-lime-50 border-l-2 border-l-lime-500"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-slate-800 truncate">
                    {s.siteId}
                  </span>
                  {s.region && (
                    <Badge className="bg-lime-100 text-lime-800 text-[10px] font-semibold shrink-0 px-1.5 py-0 h-4 uppercase tracking-tight">
                      {s.region}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">{s.name}</p>
              </button>
            ))
          )}

          {/* Unmapped sites notice */}
          {unmappedSites.length > 0 && (
            <div className="p-3 mx-3 my-2 rounded-md bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-1.5 text-amber-700 text-xs font-semibold mb-1">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {unmappedSites.length} site{unmappedSites.length > 1 ? "s" : ""} without GPS
              </div>
              <p className="text-amber-600 text-xs">
                Edit these sites to add coordinates so they appear on the map.
              </p>
              <ul className="mt-1.5 space-y-0.5">
                {unmappedSites.slice(0, 5).map((s) => (
                  <li key={s.id} className="text-xs text-amber-700 truncate">
                    • {s.siteId} — {s.name}
                  </li>
                ))}
                {unmappedSites.length > 5 && (
                  <li className="text-xs text-amber-500 italic">
                    …and {unmappedSites.length - 5} more
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ── Map area ── */}
      <div className="relative flex-1">
        {/* Leaflet CSS — must be loaded in client code for Next.js */}
        <style>{`
          @import url("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
          .leaflet-container { font-family: inherit; }
          .leaflet-tooltip { font-size: 12px; border-radius: 6px; padding: 4px 8px; }
        `}</style>

        <div ref={mapRef} className="absolute inset-0" />

        {/* Site info panel (floating over map) */}
        {selectedSite && (
          <div className="absolute top-4 right-4 z-[1000] w-72 rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden">
            {/* Panel header */}
            <div className="bg-lime-600 px-4 py-3 text-white flex items-start justify-between gap-2">
              <div>
                <div className="font-bold text-sm uppercase tracking-tight">
                  {selectedSite.siteId}
                </div>
                <div className="text-lime-100 text-xs mt-0.5 leading-snug">
                  {selectedSite.name}
                </div>
              </div>
              <button
                onClick={() => setSelectedSite(null)}
                className="text-lime-200 hover:text-white mt-0.5 shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Panel body */}
            <div className="p-4 space-y-3 text-sm">
              {/* Location */}
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-lime-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-700 text-xs uppercase tracking-tight mb-0.5">Location</p>
                  <p className="text-gray-600">{selectedSite.region || "—"}</p>
                  <p className="text-gray-400 text-xs mt-0.5 font-mono">
                    {selectedSite.gpsCoordinates}
                  </p>
                </div>
              </div>

              {/* Fuel */}
              <div className="flex items-start gap-2">
                <Fuel className="h-4 w-4 text-lime-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-700 text-xs uppercase tracking-tight mb-0.5">Fuel Tank</p>
                  <p className="text-gray-600">
                    {selectedSite.tankerCapacity
                      ? `${selectedSite.tankerCapacity.toLocaleString()} L capacity`
                      : "Capacity not set"}
                  </p>
                </div>
              </div>

              {/* Generator */}
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-lime-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-700 text-xs uppercase tracking-tight mb-0.5">Generator</p>
                  {selectedSite.generator ? (
                    <div className="space-y-0.5 text-gray-600">
                      <p>{selectedSite.generator.genId}</p>
                      {selectedSite.generator.model && (
                        <p className="text-xs text-gray-500">
                          Model: {selectedSite.generator.model}
                        </p>
                      )}
                      {selectedSite.generator.capacityKVA && (
                        <p className="text-xs text-gray-500">
                          {selectedSite.generator.capacityKVA} kVA
                        </p>
                      )}
                      {selectedSite.generator.lastRunningHours != null && (
                        <p className="text-xs text-gray-500">
                          Running hrs: {selectedSite.generator.lastRunningHours.toLocaleString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">No generator assigned</p>
                  )}
                </div>
              </div>

              {/* DG info */}
              {(selectedSite.dgType || selectedSite.dgCapacity) && (
                <div className="pt-2 border-t border-slate-100 text-xs text-gray-500 space-y-0.5">
                  {selectedSite.dgType && <p>DG Type: {selectedSite.dgType}</p>}
                  {selectedSite.dgCapacity && <p>DG Capacity: {selectedSite.dgCapacity}</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Map loading overlay */}
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <div className="h-8 w-8 rounded-full border-2 border-lime-500 border-t-transparent animate-spin" />
              <p className="text-sm">Loading map…</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
