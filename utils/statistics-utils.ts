import { winningNumbers } from "@/data/winning-numbers"

// Number frequency analysis
export interface NumberFrequency {
  number: number
  count: number
  percentage: number
}

// Get frequency of each number (1-45) from winning numbers
export const getNumberFrequencies = (): NumberFrequency[] => {
  const frequencies: Record<number, number> = {}

  // Initialize frequencies for all numbers 1-45
  for (let i = 1; i <= 45; i++) {
    frequencies[i] = 0
  }

  // Count occurrences of each number in winning numbers
  winningNumbers.forEach((result) => {
    result.numbers.forEach((num) => {
      frequencies[num]++
    })
  })

  // Calculate total draws and convert to array
  const totalDraws = winningNumbers.length
  const totalNumbers = totalDraws * 6 // 6 numbers per draw

  return Object.entries(frequencies)
    .map(([number, count]) => ({
      number: Number.parseInt(number),
      count,
      percentage: totalNumbers > 0 ? (count / totalNumbers) * 100 : 0,
    }))
    .sort((a, b) => a.number - b.number) // Sort by number
}

// Get frequency of each bonus number (1-45)
export const getBonusNumberFrequencies = (): NumberFrequency[] => {
  const frequencies: Record<number, number> = {}

  // Initialize frequencies for all numbers 1-45
  for (let i = 1; i <= 45; i++) {
    frequencies[i] = 0
  }

  // Count occurrences of each bonus number
  winningNumbers.forEach((result) => {
    frequencies[result.bonusNo]++
  })

  // Calculate total draws
  const totalDraws = winningNumbers.length

  return Object.entries(frequencies)
    .map(([number, count]) => ({
      number: Number.parseInt(number),
      count,
      percentage: totalDraws > 0 ? (count / totalDraws) * 100 : 0,
    }))
    .sort((a, b) => a.number - b.number) // Sort by number
}

// Get most frequently drawn numbers
export const getMostFrequentNumbers = (limit = 5): NumberFrequency[] => {
  return getNumberFrequencies()
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

// Get least frequently drawn numbers
export const getLeastFrequentNumbers = (limit = 5): NumberFrequency[] => {
  return getNumberFrequencies()
    .sort((a, b) => a.count - b.count)
    .slice(0, limit)
}

// Get most frequently drawn bonus numbers
export const getMostFrequentBonusNumbers = (limit = 5): NumberFrequency[] => {
  return getBonusNumberFrequencies()
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

// Get total number of draws
export const getTotalDraws = (): number => {
  return winningNumbers.length
}

// Get latest draw information
export const getLatestDraw = () => {
  if (winningNumbers.length === 0) return null
  return winningNumbers[winningNumbers.length - 1] // Return the last element (most recent draw)
}

// Get statistics by number range (1-10, 11-20, etc.)
export const getNumberRangeStatistics = (): { range: string; count: number; percentage: number }[] => {
  const frequencies = getNumberFrequencies()
  const ranges = [
    { name: "1-10", min: 1, max: 10 },
    { name: "11-20", min: 11, max: 20 },
    { name: "21-30", min: 21, max: 30 },
    { name: "31-40", min: 31, max: 40 },
    { name: "41-45", min: 41, max: 45 },
  ]

  const totalCount = frequencies.reduce((sum, freq) => sum + freq.count, 0)

  return ranges.map((range) => {
    const rangeNumbers = frequencies.filter((freq) => freq.number >= range.min && freq.number <= range.max)
    const count = rangeNumbers.reduce((sum, freq) => sum + freq.count, 0)

    return {
      range: range.name,
      count,
      percentage: totalCount > 0 ? (count / totalCount) * 100 : 0,
    }
  })
}

// Get bonus number range statistics
export const getBonusNumberRangeStatistics = (): { range: string; count: number; percentage: number }[] => {
  const frequencies = getBonusNumberFrequencies()
  const ranges = [
    { name: "1-10", min: 1, max: 10 },
    { name: "11-20", min: 11, max: 20 },
    { name: "21-30", min: 21, max: 30 },
    { name: "31-40", min: 31, max: 40 },
    { name: "41-45", min: 41, max: 45 },
  ]

  const totalCount = winningNumbers.length

  return ranges.map((range) => {
    const rangeNumbers = frequencies.filter((freq) => freq.number >= range.min && freq.number <= range.max)
    const count = rangeNumbers.reduce((sum, freq) => sum + freq.count, 0)

    return {
      range: range.name,
      count,
      percentage: totalCount > 0 ? (count / totalCount) * 100 : 0,
    }
  })
}

// 새로운 함수: 최근 N회 동안의 번호 빈도 분석
export const getRecentNumberFrequencies = (lastNDraws = 50): NumberFrequency[] => {
  const frequencies: Record<number, number> = {}

  // Initialize frequencies for all numbers 1-45
  for (let i = 1; i <= 45; i++) {
    frequencies[i] = 0
  }

  // 최근 N회 당첨 번호만 가져오기
  const recentDraws = winningNumbers.slice(-Math.min(lastNDraws, winningNumbers.length))

  // Count occurrences of each number in recent winning numbers
  recentDraws.forEach((result) => {
    result.numbers.forEach((num) => {
      frequencies[num]++
    })
  })

  // Calculate total draws and convert to array
  const totalDraws = recentDraws.length
  const totalNumbers = totalDraws * 6 // 6 numbers per draw

  return Object.entries(frequencies)
    .map(([number, count]) => ({
      number: Number.parseInt(number),
      count,
      percentage: totalNumbers > 0 ? (count / totalNumbers) * 100 : 0,
    }))
    .sort((a, b) => a.number - b.number) // Sort by number
}

// 새로운 함수: 홀짝 분석
export const getOddEvenAnalysis = (): { type: string; count: number; percentage: number }[] => {
  let oddCount = 0
  let evenCount = 0
  let totalNumbers = 0

  winningNumbers.forEach((draw) => {
    draw.numbers.forEach((num) => {
      if (num % 2 === 0) {
        evenCount++
      } else {
        oddCount++
      }
      totalNumbers++
    })
  })

  return [
    {
      type: "홀수",
      count: oddCount,
      percentage: totalNumbers > 0 ? (oddCount / totalNumbers) * 100 : 0,
    },
    {
      type: "짝수",
      count: evenCount,
      percentage: totalNumbers > 0 ? (evenCount / totalNumbers) * 100 : 0,
    },
  ]
}

// 새로운 함수: 번호 합계 범위 분석
export const getSumRangeAnalysis = (): { range: string; count: number; percentage: number }[] => {
  const sumRanges = [
    { name: "1-100", min: 1, max: 100 },
    { name: "101-150", min: 101, max: 150 },
    { name: "151-200", min: 151, max: 200 },
    { name: "201-255", min: 201, max: 255 },
  ]

  const rangeCounts: Record<string, number> = {}
  sumRanges.forEach((range) => {
    rangeCounts[range.name] = 0
  })

  winningNumbers.forEach((draw) => {
    const sum = draw.numbers.reduce((acc, num) => acc + num, 0)
    for (const range of sumRanges) {
      if (sum >= range.min && sum <= range.max) {
        rangeCounts[range.name]++
        break
      }
    }
  })

  const totalDraws = winningNumbers.length

  return sumRanges.map((range) => ({
    range: range.name,
    count: rangeCounts[range.name],
    percentage: totalDraws > 0 ? (rangeCounts[range.name] / totalDraws) * 100 : 0,
  }))
}

// 새로운 함수: 번호 간 간격 분석
export const getGapAnalysis = (): { gap: string; count: number; percentage: number }[] => {
  const gapRanges = [
    { name: "작은 간격 (1-3)", min: 1, max: 3 },
    { name: "중간 간격 (4-8)", min: 4, max: 8 },
    { name: "큰 간격 (9+)", min: 9, max: 100 },
  ]

  const gapCounts: Record<string, number> = {}
  gapRanges.forEach((range) => {
    gapCounts[range.name] = 0
  })

  let totalGaps = 0

  winningNumbers.forEach((draw) => {
    const sortedNumbers = [...draw.numbers].sort((a, b) => a - b)

    for (let i = 1; i < sortedNumbers.length; i++) {
      const gap = sortedNumbers[i] - sortedNumbers[i - 1]
      totalGaps++

      for (const range of gapRanges) {
        if (gap >= range.min && gap <= range.max) {
          gapCounts[range.name]++
          break
        }
      }
    }
  })

  return gapRanges.map((range) => ({
    gap: range.name,
    count: gapCounts[range.name],
    percentage: totalGaps > 0 ? (gapCounts[range.name] / totalGaps) * 100 : 0,
  }))
}

// 새로운 함수: 연속 번호 분석
export const getConsecutiveNumbersAnalysis = (): { count: number; occurrences: number; percentage: number }[] => {
  const consecutiveCounts: Record<number, number> = {
    0: 0, // 연속 번호 없음
    1: 0, // 연속 번호 1쌍
    2: 0, // 연속 번호 2쌍
    3: 0, // 연속 번호 3쌍 이상
  }

  winningNumbers.forEach((draw) => {
    const sortedNumbers = [...draw.numbers].sort((a, b) => a - b)
    let consecutivePairs = 0

    for (let i = 1; i < sortedNumbers.length; i++) {
      if (sortedNumbers[i] === sortedNumbers[i - 1] + 1) {
        consecutivePairs++
      }
    }

    if (consecutivePairs >= 3) {
      consecutiveCounts[3]++
    } else {
      consecutiveCounts[consecutivePairs]++
    }
  })

  const totalDraws = winningNumbers.length

  return Object.entries(consecutiveCounts).map(([count, occurrences]) => ({
    count: Number.parseInt(count),
    occurrences,
    percentage: totalDraws > 0 ? (occurrences / totalDraws) * 100 : 0,
  }))
}

// 새로운 함수: 번호 휴면 기간 분석 (마지막 등장 이후 경과 회차)
export const getNumberDormancyPeriods = (): { number: number; lastAppearance: number; dormancyPeriod: number }[] => {
  const latestAppearances: Record<number, number> = {}
  const currentDraw = winningNumbers.length

  // Initialize with -1 to indicate never appeared
  for (let i = 1; i <= 45; i++) {
    latestAppearances[i] = -1
  }

  // Find the latest appearance of each number
  winningNumbers.forEach((draw, index) => {
    draw.numbers.forEach((num) => {
      latestAppearances[num] = index
    })
    // Also check bonus number
    latestAppearances[draw.bonusNo] = index
  })

  return Object.entries(latestAppearances)
    .map(([number, lastAppearance]) => ({
      number: Number.parseInt(number),
      lastAppearance: lastAppearance + 1, // Convert to 1-based draw number
      dormancyPeriod: lastAppearance === -1 ? currentDraw : currentDraw - lastAppearance - 1,
    }))
    .sort((a, b) => b.dormancyPeriod - a.dormancyPeriod) // Sort by dormancy period (descending)
}
