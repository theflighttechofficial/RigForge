/**
 * Windows Hardware Error Architecture (WHEA) & Kernel Crash Lexicon
 * Provides detailed diagnostics for silicon instability, voltage droop, and thermal bit-flips.
 */

export interface WheaErrorEntry {
  id: string;
  code: string;
  name: string;
  category: 'VOLTAGE' | 'FABRIC_MEMORY' | 'POWER_TRANSIENT' | 'THERMAL_FATAL';
  severity: 'CORRECTABLE' | 'UNRECOVERABLE_BSOD' | 'HARD_POWER_OFF' | 'FATAL_BSOD';
  affectedSubsystem: string;
  eventViewerSource: string;
  description: string;
  siliconMechanism: string;
  likelyCulprit: string;
  actionableFixes: string[];
}

export const WHEA_LEXICON: WheaErrorEntry[] = [
  {
    id: 'whea-18',
    code: 'WHEA Event 18',
    name: 'Machine Check Exception (Cache Hierarchy Error)',
    category: 'VOLTAGE',
    severity: 'FATAL_BSOD',
    affectedSubsystem: 'CPU L1/L2/L3 Cache & Core Ring',
    eventViewerSource: 'Microsoft-Windows-WHEA-Logger',
    description: 'A fatal hardware error occurred reported by a component processor core. This indicates a CPU cache hierarchy instruction fetch failure under load.',
    siliconMechanism: 'The voltage delivered to the SRAM cache cells dipped below minimum retention threshold during transient clock burst, causing a bit-flip in L2/L3 data cache line.',
    likelyCulprit: 'Excessive negative Curve Optimizer undervolt, low Vcore LLC level, or high transient vdroop.',
    actionableFixes: [
      'Back off Curve Optimizer offset by +3 to +5 counts on the reported APIC ID core.',
      'Raise Load-Line Calibration (LLC) by one tier (e.g., Level 3 to Level 4) in BIOS.',
      'Verify CPU Vcore offset is not starving silicon during light-to-heavy load transitions.'
    ]
  },
  {
    id: 'bugcheck-124',
    code: 'BugCheck 0x00000124',
    name: 'WHEA_UNCORRECTABLE_ERROR',
    category: 'VOLTAGE',
    severity: 'FATAL_BSOD',
    affectedSubsystem: 'CPU Instruction Pipeline & Power Planes',
    eventViewerSource: 'Windows Kernel / BugCheck',
    description: 'A fatal uncorrectable hardware error occurred, forcing an immediate blue screen of death (BSOD) to prevent silent data corruption.',
    siliconMechanism: 'Motherboard VRM power plane failed to keep pace with an aggressive AVX-512 vector load step, causing core rail voltage to collapse below operating limits.',
    likelyCulprit: 'VRM thermal throttling, weak load-line calibration, or insufficient core vdroop compensation.',
    actionableFixes: [
      'Increase Load-Line Calibration (LLC) from Standard to Balanced/Medium.',
      'Disable aggressive PBO scalar (>1X) or Intel MCE (Multi-Core Enhancement).',
      'Ensure VRM heatsinks receive adequate intake airflow within the chassis.'
    ]
  },
  {
    id: 'thermtrip',
    code: 'THERMTRIP# Signal',
    name: 'Silicon Junction Critical Thermal Trip',
    category: 'THERMAL_FATAL',
    severity: 'HARD_POWER_OFF',
    affectedSubsystem: 'Internal CPU Thermal Diode & Junction Sensors',
    eventViewerSource: 'ACPI / Hardware Embedded Controller',
    description: 'Emergency hardware shutdown initiated by CPU internal thermal trip comparator. System cuts all power abruptly without operating system handshake.',
    siliconMechanism: 'Junction temperature exceeded TjMax + 5°C (typically 105°C - 115°C). Silicon resistivity dropped, causing positive-feedback thermal leakage runaway.',
    likelyCulprit: 'AIO pump failure, degraded/pump-out thermal paste, unpeeled cooler plastic film, or mounting bracket uneven pressure.',
    actionableFixes: [
      'Inspect AIO liquid cooler pump RPM in BIOS to verify pump impeller rotation.',
      'Dismount cooler, clean cold plate with 99% isopropyl alcohol, and re-apply high-viscosity phase-change thermal paste (e.g. Honeywell PTM7950 or Kryonaut).',
      'Check cooler mounting standoffs for even torque and contact patch imprint.'
    ]
  },
  {
    id: 'whea-41',
    code: 'Kernel-Power Event 41 (Bugcheck 0)',
    name: 'Abrupt Hardware Power Cut / OCP Trip',
    category: 'POWER_TRANSIENT',
    severity: 'HARD_POWER_OFF',
    affectedSubsystem: 'Power Supply Unit (PSU) + 12V High-Current Rail',
    eventViewerSource: 'Microsoft-Windows-Kernel-Power',
    description: 'The system has rebooted without cleanly shutting down first. Event indicates power was suddenly interrupted or hardware watchdog reset tripped.',
    siliconMechanism: 'Sub-millisecond GPU transient power spike (up to 200% rated TGP) triggered the PSU Over-Current Protection (OCP) or Under-Voltage Protection (UVP) latch.',
    likelyCulprit: 'Degraded power supply capacitors, daisy-chained PCIe 8-pin cables, or inadequate PSU wattage rating.',
    actionableFixes: [
      'Use separate, dedicated 8-pin PCIe power cables from PSU rather than daisy-chained pigtails.',
      'Upgrade to an ATX 3.0 / PCIe 5.0 certified PSU with dedicated 12V-2x6 cable designed for 200% transient excursions.',
      'Temporarily reduce GPU Power Limit to 85-90% in MSI Afterburner to eliminate spike triggers.'
    ]
  },
  {
    id: 'whea-17',
    code: 'WHEA Event 17',
    name: 'PCI Express Root Port Hardware Bus Error',
    category: 'POWER_TRANSIENT',
    severity: 'CORRECTABLE',
    affectedSubsystem: 'PCIe Bus / NVMe Storage / Discrete GPU',
    eventViewerSource: 'Microsoft-Windows-WHEA-Logger',
    description: 'A corrected hardware error occurred on a PCI Express root port or device link. Communication integrity degraded resulting in packet retries.',
    siliconMechanism: 'High-frequency signal degradation across motherboard PCIe traces or PCIe riser cable due to EMI interference or voltage ripple.',
    likelyCulprit: 'PCIe Gen 4/5 riser cable attenuation, dirty slot contacts, or PCIe ASPM power-state switching.',
    actionableFixes: [
      'Force PCIe slot generation from "Auto" to "Gen 3" or "Gen 4" in motherboard BIOS if using a vertical GPU riser.',
      'Disable PCIe ASPM (Active State Power Management) in BIOS Power settings.',
      'Clean motherboard PCIe slot and GPU gold fingers with electrical contact cleaner.'
    ]
  },
  {
    id: 'whea-19',
    code: 'WHEA Event 19',
    name: 'Infinity Fabric / Memory Bus Parity Error',
    category: 'FABRIC_MEMORY',
    severity: 'CORRECTABLE',
    affectedSubsystem: 'AMD Infinity Fabric (FCLK) & Memory Controller',
    eventViewerSource: 'Microsoft-Windows-WHEA-Logger',
    description: 'A corrected hardware bus interconnect parity error was logged. While non-fatal, it causes microstutters and indicates borderline memory stability.',
    siliconMechanism: 'FCLK clock frequency exceeded the silicon interconnect signaling margin, leading to single-bit transmission errors corrected by CRC retry.',
    likelyCulprit: 'Overclocked Infinity Fabric (e.g. 2100MHz+ on Zen 3/4) or insufficient SOC voltage.',
    actionableFixes: [
      'Lower Infinity Fabric FCLK frequency by 33–66 MHz (e.g., from 2133MHz to 2000MHz).',
      'Adjust CPU SOC voltage to stable 1.20V–1.25V (do not exceed 1.30V on Zen 4/5 to avoid silicon burn).',
      'Loosen secondary DRAM sub-timings (tRFC, tREFI) in BIOS memory config.'
    ]
  },
  {
    id: 'bugcheck-101',
    code: 'BugCheck 0x00000101',
    name: 'CLOCK_WATCHDOG_TIMEOUT',
    category: 'VOLTAGE',
    severity: 'FATAL_BSOD',
    affectedSubsystem: 'Multi-Core Inter-Processor Interrupt (IPI) & Ring Bus',
    eventViewerSource: 'Windows Kernel / BugCheck',
    description: 'An expected clock interrupt was not received on a secondary processor core within the allocated quantum time window.',
    siliconMechanism: 'A physical CPU core locked up completely because its internal Ring Bus or Vcore starved of voltage, dropping interrupt packet replies.',
    likelyCulprit: 'Intel 13th/14th Gen microcode voltage degradation (Vmin shift), Ring LLC droop, or uneven thermal paste.',
    actionableFixes: [
      'Flash motherboard BIOS to latest microcode (0x129 / 0x12B for Intel Raptor Lake).',
      'Increase CPU Vcore or CPU Ring voltage by +20mV in BIOS.',
      'Set Intel Default Settings (Extreme/Performance Profile with 253W PL1/PL2 limits).'
    ]
  }
];

export const WHEA_LEXICON_MAP: Record<string, WheaErrorEntry> = WHEA_LEXICON.reduce((acc, entry) => {
  acc[entry.id] = entry;
  return acc;
}, {} as Record<string, WheaErrorEntry>);
