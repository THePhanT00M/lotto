"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Calendar, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  getNumberFrequencies,
  getBonusNumberFrequencies,
  getMostFrequentNumbers,
  getLeastFrequentNumbers,
  getMostFrequentBonusNumbers,
  getTotalDraws,
  getLatestDraw,
  getNumberRangeStatistics,
  getBonusNumberRangeStatistics,
  type NumberFrequency,
} from "@/utils/statistics-utils"
import { getBallColor } from "@/utils/lotto-utils"
import { format, parseISO } from "date-fns"
import { ko } from "date-fns/locale"
import { winningNumbers } from "@/data/winning-numbers"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMobile } from "@/hooks/use-mobile"

export default function StatisticsPage() {
  const [frequencies, setFrequencies] = useState<NumberFrequency[]>([])
  const [bonusFrequencies, setBonusFrequencies] = useState<NumberFrequency[]>([])
  const [mostFrequent, setMostFrequent] = useState<NumberFrequency[]>([])
  const [leastFrequent, setLeastFrequent] = useState<NumberFrequency[]>([])
  const [mostFrequentBonus, setMostFrequentBonus] = useState<NumberFrequency[]>([])
  const [totalDraws, setTotalDraws] = useState(0)
  const [latestDraw, setLatestDraw] = useState<any>(null)
  const [rangeStats, setRangeStats] = useState<{ range: string; count: number; percentage: number }[]>([])
  const [bonusRangeStats, setBonusRangeStats] = useState<{ range: string; count: number; percentage: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentDrawIndex, setCurrentDrawIndex] = useState(0)
  const [visibleDraws, setVisibleDraws] = useState<any[]>([])
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 })
  const [activeTab, setActiveTab] = useState("stats")
  const [searchValue, setSearchValue] = useState("")
  const [pendingScrollIndex, setPendingScrollIndex] = useState<number | null>(null)
  const selectedDrawRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const historyTabRef = useRef<HTMLDivElement>(null)
  const isInitialTabChange = useRef(true)
  const isMobile = useMobile()

  // 상태 타입에 sumRange 필드를 추가합니다
  const [textStats, setTextStats] = useState<{
    avgSum: number
    mostCommonSum: number
    oddEvenRatio: string
    mostCommonPattern: string
    consecutiveStats: string
    sumRange?: {
      lowerBound: number
      upperBound: number
      minSum: number
      maxSum: number
    }
  }>({
    avgSum: 0,
    mostCommonSum: 0,
    oddEvenRatio: "",
    mostCommonPattern: "",
    consecutiveStats: "",
  })

  // Get reversed winning numbers for display (newest first)
  const reversedWinningNumbers = [...winningNumbers].reverse()
  const currentDraw = reversedWinningNumbers[currentDrawIndex]

  useEffect(() => {
    // Load statistics
    const loadStatistics = () => {
      setIsLoading(true)

      // Get statistics data
      const freqData = getNumberFrequencies()
      const bonusFreqData = getBonusNumberFrequencies()
      const mostFreqData = getMostFrequentNumbers(6)
      const leastFreqData = getLeastFrequentNumbers(6)
      const mostFreqBonusData = getMostFrequentBonusNumbers(5)
      const totalDrawsCount = getTotalDraws()
      const latestDrawData = getLatestDraw()
      const rangeStatsData = getNumberRangeStatistics()
      const bonusRangeStatsData = getBonusNumberRangeStatistics()

      // Calculate additional text statistics
      const textStatsData = calculateTextStatistics()

      // Update state
      setFrequencies(freqData)
      setBonusFrequencies(bonusFreqData)
      setMostFrequent(mostFreqData)
      setLeastFrequent(leastFreqData)
      setMostFrequentBonus(mostFreqBonusData)
      setTotalDraws(totalDrawsCount)
      setLatestDraw(latestDrawData)
      setRangeStats(rangeStatsData)
      setBonusRangeStats(bonusRangeStatsData)
      setTextStats(textStatsData)

      // Set current draw index to the latest draw (reversed order)
      setCurrentDrawIndex(0)

      // Initialize visible draws
      updateVisibleDraws(0, 0, 50)

      setIsLoading(false)
    }

    loadStatistics()
  }, [])

  // Update visible draws when tab changes
  useEffect(() => {
    if (activeTab === "history") {
      // Force a complete refresh of visible draws when tab changes
      const newStart = Math.max(0, currentDrawIndex - 25)
      const newEnd = Math.min(reversedWinningNumbers.length, newStart + 50)

      // Update visible draws with current index
      updateVisibleDraws(currentDrawIndex, newStart, newEnd)

      // Set a pending scroll to ensure we scroll after render
      setPendingScrollIndex(currentDrawIndex)

      // Reset the initial tab change flag
      isInitialTabChange.current = false
    }
  }, [activeTab])

  // Handle pending scroll after visible draws update
  useEffect(() => {
    if (pendingScrollIndex !== null && activeTab === "history") {
      // Use multiple timeouts with increasing delays to ensure scrolling works
      const scrollToSelectedDraw = () => {
        if (selectedDrawRef.current && scrollContainerRef.current) {
          // On mobile, scroll the container instead of using scrollIntoView
          if (isMobile) {
            // Calculate the position to scroll to
            const containerRect = scrollContainerRef.current.getBoundingClientRect()
            const selectedRect = selectedDrawRef.current.getBoundingClientRect()
            const relativeTop = selectedRect.top - containerRect.top

            // Scroll the container to position the selected item at the top with some padding
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollTop + relativeTop - 20
          } else {
            // On desktop, use scrollIntoView
            selectedDrawRef.current.scrollIntoView({
              behavior: "smooth",
              block: "center",
            })
          }

          // Clear the pending scroll
          setPendingScrollIndex(null)
        }
      }

      // Try scrolling after different delays to ensure it works
      // Use longer delays on mobile
      const delays = isMobile ? [300, 600, 900] : [100, 300, 500]
      const timeouts = delays.map((delay) => setTimeout(scrollToSelectedDraw, delay))

      return () => {
        // Clean up timeouts
        timeouts.forEach((timeout) => clearTimeout(timeout))
      }
    }
  }, [pendingScrollIndex, visibleDraws, activeTab, isMobile])

  // Update visible draws when currentDrawIndex changes
  useEffect(() => {
    if (activeTab === "history") {
      // Ensure the selected draw is in the visible range
      if (currentDrawIndex < visibleRange.start || currentDrawIndex >= visibleRange.end) {
        // Calculate new visible range centered around the current draw
        const newStart = Math.max(0, currentDrawIndex - 25)
        const newEnd = Math.min(reversedWinningNumbers.length, newStart + 50)
        updateVisibleDraws(currentDrawIndex, newStart, newEnd)
      }

      // Set pending scroll to ensure we scroll after render
      setPendingScrollIndex(currentDrawIndex)
    }
  }, [currentDrawIndex, activeTab])

  // Handle scroll events to load more draws
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const scrollPosition = scrollTop + clientHeight

    // Load more draws when scrolling down
    if (scrollPosition > scrollHeight - 200 && visibleRange.end < reversedWinningNumbers.length) {
      const newEnd = Math.min(reversedWinningNumbers.length, visibleRange.end + 20)
      updateVisibleDraws(currentDrawIndex, visibleRange.start, newEnd)
    }

    // Load more draws when scrolling up
    if (scrollTop < 200 && visibleRange.start > 0) {
      const newStart = Math.max(0, visibleRange.start - 20)
      updateVisibleDraws(currentDrawIndex, newStart, visibleRange.end)
    }
  }

  // Update visible draws
  const updateVisibleDraws = (currentIdx: number, start: number, end: number) => {
    // Ensure current draw is visible
    let newStart = start
    let newEnd = end

    if (currentIdx < start) {
      newStart = Math.max(0, currentIdx - 10)
    } else if (currentIdx >= end) {
      newEnd = Math.min(reversedWinningNumbers.length, currentIdx + 10)
    }

    // Update visible range
    setVisibleRange({ start: newStart, end: newEnd })

    // Update visible draws
    setVisibleDraws(reversedWinningNumbers.slice(newStart, newEnd))
  }

  // Calculate additional text statistics
  const calculateTextStatistics = () => {
    // Calculate average sum of winning numbers
    const sums = winningNumbers.map((draw) => draw.numbers.reduce((acc, num) => acc + num, 0))
    const avgSum = Math.round(sums.reduce((acc, sum) => acc + sum, 0) / sums.length)

    // Find most common sum (mode)
    const sumCounts: Record<number, number> = {}
    sums.forEach((sum) => {
      sumCounts[sum] = (sumCounts[sum] || 0) + 1
    })
    const mostCommonSum = Number(
      Object.entries(sumCounts)
        .sort((a, b) => b[1] - a[1])
        .map((entry) => entry[0])[0],
    )

    // 다음 코드를 추가하여 합계 범위를 계산합니다.
    // 표준편차 계산
    const sumSquareDiffs = sums.reduce((acc, sum) => acc + Math.pow(sum - avgSum, 2), 0)
    const stdDev = Math.round(Math.sqrt(sumSquareDiffs / sums.length))

    // 일반적인 범위 (평균 ± 1 표준편차)
    const lowerBound = avgSum - stdDev
    const upperBound = avgSum + stdDev

    // 최소값과 최대값
    const minSum = Math.min(...sums)
    const maxSum = Math.max(...sums)

    // Calculate odd-even ratio statistics
    const oddEvenCounts: Record<string, number> = {}
    winningNumbers.forEach((draw) => {
      const oddCount = draw.numbers.filter((num) => num % 2 === 1).length
      const evenCount = 6 - oddCount
      const ratio = `${oddCount}:${evenCount}`
      oddEvenCounts[ratio] = (oddEvenCounts[ratio] || 0) + 1
    })
    const mostCommonOddEven = Object.entries(oddEvenCounts)
      .sort((a, b) => b[1] - a[1])
      .map((entry) => `${entry[0]} (${Math.round((entry[1] / winningNumbers.length) * 100)}%)`)
      .slice(0, 2)
      .join(", ")

    // Calculate range pattern statistics
    const patterns: Record<string, number> = {}
    winningNumbers.forEach((draw) => {
      const ranges = [0, 0, 0, 0, 0] // [1-10, 11-20, 21-30, 31-40, 41-45]
      draw.numbers.forEach((num) => {
        if (num >= 1 && num <= 10) ranges[0]++
        else if (num >= 11 && num <= 20) ranges[1]++
        else if (num >= 21 && num <= 30) ranges[2]++
        else if (num >= 31 && num <= 40) ranges[3]++
        else if (num >= 41 && num <= 45) ranges[4]++
      })
      const pattern = ranges.join("-")
      patterns[pattern] = (patterns[pattern] || 0) + 1
    })
    const mostCommonPattern = Object.entries(patterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(
        (entry) =>
          `${entry[0]
            .split("-")
            .map((v, i) => {
              const ranges = ["1-10", "11-20", "21-30", "31-40", "41-45"]
              return v !== "0" ? `${ranges[i]}(${v})` : ""
            })
            .filter(Boolean)
            .join(", ")} (${entry[1]}회)`,
      )
      .join("; ")

    // Calculate consecutive numbers statistics
    const consecutiveCounts = [0, 0, 0, 0, 0, 0] // 0, 1, 2, 3, 4, 5 consecutive pairs
    winningNumbers.forEach((draw) => {
      const sortedNumbers = [...draw.numbers].sort((a, b) => a - b)
      let consecutivePairs = 0
      for (let i = 0; i < sortedNumbers.length - 1; i++) {
        if (sortedNumbers[i + 1] - sortedNumbers[i] === 1) {
          consecutivePairs++
        }
      }
      consecutiveCounts[consecutivePairs]++
    })
    const consecutiveStats = consecutiveCounts
      .map((count, index) => {
        if (count === 0) return null
        const percentage = Math.round((count / winningNumbers.length) * 100)
        return `연속된 숫자 ${index}쌍: ${count}회 (${percentage}%)`
      })
      .filter(Boolean)
      .join(", ")

    return {
      avgSum,
      mostCommonSum,
      oddEvenRatio: mostCommonOddEven,
      mostCommonPattern,
      consecutiveStats,
      // 계산된 범위 값들을 추가합니다
      sumRange: {
        lowerBound,
        upperBound,
        minSum,
        maxSum,
      },
    }
  }

  // Find the maximum count for scaling the bars
  const maxCount = frequencies.length > 0 ? Math.max(...frequencies.map((f) => f.count)) : 0
  const maxBonusCount = bonusFrequencies.length > 0 ? Math.max(...bonusFrequencies.map((f) => f.count)) : 0

  // Handle navigation
  const goToPreviousDraw = () => {
    if (currentDrawIndex < reversedWinningNumbers.length - 1) {
      setCurrentDrawIndex(currentDrawIndex + 1)
    }
  }

  const goToNextDraw = () => {
    if (currentDrawIndex > 0) {
      setCurrentDrawIndex(currentDrawIndex - 1)
    }
  }

  // Jump to specific draw
  const jumpToDraw = (drawNo: number) => {
    const index = reversedWinningNumbers.findIndex((draw) => draw.drawNo === drawNo)
    if (index !== -1) {
      setCurrentDrawIndex(index)
    }
  }

  // Handle quick navigation
  const handleQuickNavigation = (startIdx: number) => {
    setCurrentDrawIndex(startIdx)
    // Force a refresh of visible draws
    const newStart = Math.max(0, startIdx - 25)
    const newEnd = Math.min(reversedWinningNumbers.length, newStart + 50)
    updateVisibleDraws(startIdx, newStart, newEnd)
    // Set pending scroll
    setPendingScrollIndex(startIdx)
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, "")
    setSearchValue(value)
  }

  // Handle search
  const handleSearch = () => {
    const drawNo = Number.parseInt(searchValue)
    if (!isNaN(drawNo) && drawNo > 0) {
      jumpToDraw(drawNo)
      setSearchValue("")
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">로또 당첨번호 통계</h1>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500">통계를 불러오는 중...</p>
        </div>
      ) : (
        <div className="space-y-8">
          <Tabs defaultValue="stats" className="w-full" onValueChange={(value) => setActiveTab(value)}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="stats">통계 분석</TabsTrigger>
              <TabsTrigger value="history">역대 당첨번호</TabsTrigger>
            </TabsList>

            <TabsContent value="stats" className="space-y-8">
              {/* Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  {latestDraw && (
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>
                        최근 추첨일: {format(parseISO(latestDraw.date), "yyyy년 MM월 dd일", { locale: ko })} (
                        {latestDraw.drawNo}회)
                      </span>
                    </div>
                  )}
                  <p className="text-gray-600 mb-2 md:mb-0">
                    총 <span className="font-semibold">{totalDraws}회</span> 추첨 결과 분석
                  </p>
                </div>
              </div>

              {/* Latest Draw */}
              {latestDraw && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">최근 당첨번호 ({latestDraw.drawNo}회)</h2>
                  <div className="flex items-center justify-center mb-4 py-2">
                    <div className="grid grid-cols-8 gap-1 xs:gap-2 sm:gap-3 md:gap-4 w-full max-w-md">
                      {latestDraw.numbers.map((number: number, index: number) => (
                        <div
                          key={number}
                          className="w-full aspect-square rounded-full flex items-center justify-center text-black font-bold text-xs xs:text-sm sm:text-base md:text-lg shadow-md"
                          style={{ backgroundColor: getBallColor(number) }}
                        >
                          {number}
                        </div>
                      ))}
                      <div className="flex items-center justify-center">
                        <span className="text-gray-500 text-sm xs:text-base md:text-lg font-medium">+</span>
                      </div>
                      <div
                        className="w-full aspect-square rounded-full flex items-center justify-center text-black font-bold text-xs xs:text-sm sm:text-base shadow-md relative"
                        style={{ backgroundColor: getBallColor(latestDraw.bonusNo) }}
                      >
                        {latestDraw.bonusNo}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Text Statistics */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-5">주요 통계 데이터</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-gray-50 p-5 rounded-lg">
                    <h3 className="text-base font-medium text-gray-800 mb-3 border-b pb-2">당첨번호 합계</h3>
                    <div className="space-y-3 text-gray-700">
                      <div className="flex justify-between items-center">
                        <span>평균 합계:</span>
                        <span className="font-semibold text-blue-700">{textStats.avgSum}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>가장 많이 나온 합계:</span>
                        <span className="font-semibold text-blue-700">{textStats.mostCommonSum}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>일반적인 합계 범위:</span>
                        <span className="font-semibold text-blue-700">
                          {textStats.sumRange
                            ? `${textStats.sumRange.lowerBound}~${textStats.sumRange.upperBound}`
                            : "계산 중..."}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>전체 합계 범위:</span>
                        <span className="font-semibold text-blue-700">
                          {textStats.sumRange
                            ? `${textStats.sumRange.minSum}~${textStats.sumRange.maxSum}`
                            : "계산 중..."}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-5 rounded-lg">
                    <h3 className="text-base font-medium text-gray-800 mb-3 border-b pb-2">홀짝 비율</h3>
                    <div className="space-y-3 text-gray-700">
                      <div className="flex flex-col">
                        <span className="mb-2">가장 많이 나온 홀짝 비율:</span>
                        <span className="font-semibold text-blue-700 text-center bg-blue-50 py-2 rounded-md">
                          {textStats.oddEvenRatio}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-5 rounded-lg">
                    <h3 className="text-base font-medium text-gray-800 mb-3 border-b pb-2">번호 구간 패턴</h3>
                    <div className="text-gray-700">
                      <p className="mb-2">자주 나오는 패턴:</p>
                      <div className="bg-blue-50 p-3 rounded-md">
                        {textStats.mostCommonPattern.split(";").map((pattern, index) => (
                          <div key={index} className="font-medium text-blue-700 mb-1 last:mb-0">
                            {pattern.trim()}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-5 rounded-lg">
                    <h3 className="text-base font-medium text-gray-800 mb-3 border-b pb-2">연속된 번호</h3>
                    <div className="bg-blue-50 p-3 rounded-md">
                      {textStats.consecutiveStats.split(",").map((stat, index) => (
                        <div key={index} className="text-gray-700 mb-1 last:mb-0">
                          <span className="font-medium text-blue-700">{stat.trim()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Most and Least Frequent Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Most Frequent */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">가장 많이 나온 번호</h2>
                  <div className="space-y-3">
                    {mostFrequent.map((item) => (
                      <div key={item.number} className="flex items-center">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3"
                          style={{ backgroundColor: getBallColor(item.number) }}
                        >
                          {item.number}
                        </div>
                        <div className="flex-1">
                          <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${(item.count / maxCount) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="ml-3 text-gray-600 text-sm font-medium w-12 text-right">{item.count}회</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Least Frequent */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">가장 적게 나온 번호</h2>
                  <div className="space-y-3">
                    {leastFrequent.map((item) => (
                      <div key={item.number} className="flex items-center">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3"
                          style={{ backgroundColor: getBallColor(item.number) }}
                        >
                          {item.number}
                        </div>
                        <div className="flex-1">
                          <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${(item.count / maxCount) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="ml-3 text-gray-600 text-sm font-medium w-12 text-right">{item.count}회</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bonus Numbers */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-800">보너스 번호 통계</h2>
                </div>
                <div className="space-y-3">
                  {mostFrequentBonus.map((item) => (
                    <div key={item.number} className="flex items-center">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3"
                        style={{ backgroundColor: getBallColor(item.number) }}
                      >
                        {item.number}
                      </div>
                      <div className="flex-1">
                        <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500 rounded-full"
                            style={{ width: `${(item.count / maxBonusCount) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="ml-3 text-gray-600 text-sm font-medium w-12 text-right">{item.count}회</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Number Range Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main Numbers Range */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">번호 구간별 통계</h2>
                  <div className="space-y-3">
                    {rangeStats.map((item) => (
                      <div key={item.range} className="flex items-center">
                        <div className="w-16 text-gray-600 font-medium mr-3">{item.range}</div>
                        <div className="flex-1">
                          <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="ml-3 text-gray-600 text-sm font-medium w-24 text-right flex flex-col">
                          <span>{item.count}회</span>
                          <span className="text-xs text-gray-500">({item.percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bonus Numbers Range */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">보너스 번호 구간별 통계</h2>
                  <div className="space-y-3">
                    {bonusRangeStats.map((item) => (
                      <div key={item.range} className="flex items-center">
                        <div className="w-16 text-gray-600 font-medium mr-3">{item.range}</div>
                        <div className="flex-1">
                          <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-500 rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="ml-3 text-gray-600 text-sm font-medium w-24 text-right flex flex-col">
                          <span>{item.count}회</span>
                          <span className="text-xs text-gray-500">({item.percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* All Numbers Frequency */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-medium text-gray-800 mb-4">전체 번호 빈도</h2>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                  {frequencies.map((item) => (
                    <div
                      key={item.number}
                      className="flex flex-col items-center p-2 rounded-lg"
                      style={{ backgroundColor: `${getBallColor(item.number)}30` }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1"
                        style={{ backgroundColor: getBallColor(item.number) }}
                      >
                        {item.number}
                      </div>
                      <div className="text-xs font-medium">{item.count}회</div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" ref={historyTabRef}>
              {/* Historical Winning Numbers Slider */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-800">역대 당첨번호</h2>
                  <div className="text-sm text-gray-500">총 {winningNumbers.length}회 (최신순)</div>
                </div>

                {currentDraw && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousDraw}
                        disabled={currentDrawIndex >= reversedWinningNumbers.length - 1}
                        className="px-2 py-1 h-8"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        이전
                      </Button>
                      <div className="text-center">
                        <div className="font-medium text-lg">{currentDraw.drawNo}회</div>
                        <div className="text-sm text-gray-500">{currentDraw.date}</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextDraw}
                        disabled={currentDrawIndex <= 0}
                        className="px-2 py-1 h-8"
                      >
                        다음
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-center mb-4 py-2">
                      <div className="grid grid-cols-8 gap-1 xs:gap-2 sm:gap-3 md:gap-4 w-full max-w-md">
                        {currentDraw.numbers.map((number: number) => (
                          <div
                            key={number}
                            className="w-full aspect-square rounded-full flex items-center justify-center text-black font-bold text-xs xs:text-sm sm:text-base shadow-md"
                            style={{ backgroundColor: getBallColor(number) }}
                          >
                            {number}
                          </div>
                        ))}
                        <div className="flex items-center justify-center">
                          <span className="text-gray-500 text-sm xs:text-base md:text-lg font-medium">+</span>
                        </div>
                        <div
                          className="w-full aspect-square rounded-full flex items-center justify-center text-black font-bold text-xs xs:text-sm sm:text-base shadow-md relative"
                          style={{ backgroundColor: getBallColor(currentDraw.bonusNo) }}
                        >
                          {currentDraw.bonusNo}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Navigation */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">빠른 이동</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-1 text-center">
                    {[...Array(10)].map((_, idx) => {
                      const pageNum = idx + 1
                      const startIdx = (pageNum - 1) * 100
                      const endIdx = Math.min(startIdx + 99, reversedWinningNumbers.length - 1)

                      if (startIdx >= reversedWinningNumbers.length) return null

                      return (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          className="h-8 text-[10px] xs:text-xs px-1 sm:px-2"
                          onClick={() => handleQuickNavigation(startIdx)}
                        >
                          <span className="block truncate">
                            {reversedWinningNumbers[startIdx]?.drawNo || "?"}&nbsp;-&nbsp;
                            {reversedWinningNumbers[endIdx]?.drawNo || "?"}
                          </span>
                        </Button>
                      )
                    })}
                  </div>
                </div>

                {/* Search for specific draw */}
                <div className="mt-4 mb-4 flex items-center">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="회차 번호 입력"
                      className="w-full h-9 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchValue}
                      onChange={handleSearchChange}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSearch()
                        }
                      }}
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  <Button variant="outline" size="sm" className="ml-2 whitespace-nowrap" onClick={handleSearch}>
                    회차 검색
                  </Button>
                </div>

                {/* All Draws List (Scrollable) */}
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">전체 당첨번호 목록</h3>
                  <div
                    className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar"
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                  >
                    <div className="space-y-2">
                      {visibleDraws.map((draw, idx) => {
                        const actualIdx = idx + visibleRange.start
                        return (
                          <div
                            key={draw.drawNo}
                            ref={actualIdx === currentDrawIndex ? selectedDrawRef : null}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              actualIdx === currentDrawIndex
                                ? "bg-blue-50 border border-blue-200"
                                : "bg-gray-50 hover:bg-gray-100"
                            }`}
                            onClick={() => setCurrentDrawIndex(actualIdx)}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <div className="font-medium">{draw.drawNo}회</div>
                              <div className="text-sm text-gray-500">{draw.date}</div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {draw.numbers.map((number: number) => (
                                <div
                                  key={number}
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-black font-bold text-xs shadow-sm"
                                  style={{ backgroundColor: getBallColor(number) }}
                                >
                                  {number}
                                </div>
                              ))}
                              <div className="flex items-center">
                                <span className="text-gray-500 mx-0.5">+</span>
                              </div>
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-black font-bold text-xs shadow-sm"
                                style={{ backgroundColor: getBallColor(draw.bonusNo) }}
                              >
                                {draw.bonusNo}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      {visibleRange.end < reversedWinningNumbers.length && (
                        <div className="py-4 text-center text-gray-500 text-sm">스크롤하여 더 많은 당첨번호 보기</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Disclaimer */}
          <div className="bg-white rounded-xl p-4 text-sm text-gray-500">
            <p>
              * 이 통계는 최근 {totalDraws}회의 실제 로또 당첨번호를 기반으로 합니다. 통계 데이터는 참고용으로만
              사용하시기 바랍니다.
            </p>
            <p className="mt-1">
              * 로또 번호는 매 회차마다 무작위로 추첨되며, 과거의 통계가 미래 당첨 확률에 영향을 미치지 않습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
