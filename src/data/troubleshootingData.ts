export interface TroubleshootingCategory {
  id: string;
  title: string;
  iconName: string;
  description: string;
  startNodeId: string;
}

export interface DecisionNode {
  id: string;
  question: string;
  contextNote?: string;
  options: {
    label: string;
    nextStepId?: string; // If points to another question
    solution?: DiagnosticSolution; // If reaches a final diagnosis
  }[];
}

export interface DiagnosticSolution {
  title: string;
  probableCause: string;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  responsibleComponent: 'CPU' | 'GPU' | 'RAM' | 'SSD' | 'Motherboard' | 'PSU' | 'Cooler' | 'Cables' | 'Software / Driver';
  actionSteps: string[];
  preventativeTip: string;
}

export interface BSODLookupEntry {
  code: string;
  commonName: string;
  likelyCause: string;
  fixProcedure: string[];
}

export const TROUBLESHOOTING_CATEGORIES: TroubleshootingCategory[] = [
  {
    id: 'no-boot',
    title: "PC Won't Boot / No Display",
    iconName: 'Power',
    description: 'System fails to turn on, fans spin without display, or gets stuck in a POST boot loop.',
    startNodeId: 'node-boot-fans'
  },
  {
    id: 'crashes',
    title: 'Random Crashes & Freezes',
    iconName: 'AlertTriangle',
    description: 'System randomly reboots, freezes during games, or shuts down under heavy load.',
    startNodeId: 'node-crash-timing'
  },
  {
    id: 'bsod',
    title: 'Blue Screen of Death (BSOD)',
    iconName: 'MonitorX',
    description: 'Windows blue screen stop codes (e.g. IRQL_NOT_LESS_OR_EQUAL, MEMORY_MANAGEMENT).',
    startNodeId: 'node-bsod-frequency'
  },
  {
    id: 'temps',
    title: 'High Temps & Thermal Throttling',
    iconName: 'Thermometer',
    description: 'CPU/GPU temperatures exceeding 90°C, loud fan noise, or thermal throttling FPS drops.',
    startNodeId: 'node-temp-component'
  },
  {
    id: 'artifacting',
    title: 'GPU Artifacting & Visual Glitches',
    iconName: 'Sparkles',
    description: 'Screen flickering, checkerboard patterns, rainbow lines, or GPU driver crashes.',
    startNodeId: 'node-gpu-type'
  },
  {
    id: 'usb',
    title: 'USB Disconnecting / Not Recognized',
    iconName: 'Usb',
    description: 'Peripherals randomly disconnect, USB 3.0 ports failing, or power surge notifications.',
    startNodeId: 'node-usb-ports'
  },
  {
    id: 'wifi',
    title: 'Wi-Fi / Ethernet Dropping',
    iconName: 'Wifi',
    description: 'Wireless signal drops frequently, ping spikes, or motherboard Wi-Fi adapter missing.',
    startNodeId: 'node-wifi-type'
  },
  {
    id: 'slow-boot',
    title: 'Slow Boot Times & OS Lag',
    iconName: 'Clock',
    description: 'Windows takes minutes to boot, high startup disk usage, or slow BIOS handshake.',
    startNodeId: 'node-slow-drive'
  },
  {
    id: 'ssd',
    title: 'SSD Degradation & Slowness',
    iconName: 'HardDrive',
    description: 'NVMe read/write speeds dropped significantly, SMART health warnings, or corrupt files.',
    startNodeId: 'node-ssd-health'
  }
];

export const DECISION_NODES: Record<string, DecisionNode> = {
  // --- PC WON'T BOOT DECISION TREE ---
  'node-boot-fans': {
    id: 'node-boot-fans',
    question: 'Do cabinet fans, CPU cooler fans, or motherboard RGB lights turn on when you press the power button?',
    contextNote: 'Check if there is any sign of electrical life or power movement inside the case.',
    options: [
      {
        label: 'YES — Fans spin & lights turn on',
        nextStepId: 'node-boot-display'
      },
      {
        label: 'NO — Completely dead (Zero lights/fans)',
        nextStepId: 'node-boot-psu-dead'
      }
    ]
  },
  'node-boot-psu-dead': {
    id: 'node-boot-psu-dead',
    question: 'Is the rear PSU rocker switch turned on (I position), and is the wall outlet powered?',
    options: [
      {
        label: 'YES — Rocker is on and wall socket works',
        solution: {
          title: 'PSU Fault or Front Panel Power Switch Disconnected',
          probableCause: 'Blown PSU fuse, loose 24-pin ATX motherboard connector, or loose front panel PWR_BTN header wire.',
          severity: 'High',
          responsibleComponent: 'PSU',
          actionSteps: [
            '1. Perform a paperclip test on the 24-pin PSU connector to verify if the PSU fan turns on.',
            '2. Ensure the front-panel Power Switch header wire is firmly attached to the motherboard +PWR_BTN- pins.',
            '3. Try shorting the two PWR_BTN pins directly with a screwdriver to bypass a broken cabinet button.',
            '4. Verify 24-pin ATX and 8-pin CPU power cables are clicked tightly into place.'
          ],
          preventativeTip: 'Never plug high-draw gaming PCs into ungrounded extension cords or cheap surge strips.'
        }
      },
      {
        label: 'NO — Switch was turned off or socket dead',
        solution: {
          title: 'Power Line Interruption',
          probableCause: 'Interrupted power source or flipped rear PSU switch.',
          severity: 'Low',
          responsibleComponent: 'Cables',
          actionSteps: [
            '1. Flip the rear PSU rocker switch from O (Off) to I (On).',
            '2. Test the wall socket with another appliance (e.g. lamp or phone charger).',
            '3. Firmly seat the heavy AC power cord into the PSU receptacle.'
          ],
          preventativeTip: 'Always turn off the rear PSU switch before opening the chassis.'
        }
      }
    ]
  },
  'node-boot-display': {
    id: 'node-boot-display',
    question: 'Does your monitor receive any video display signal (BIOS splash logo or screen backlight)?',
    options: [
      {
        label: 'NO — Monitor says "No Signal" or stays black',
        nextStepId: 'node-boot-ram-check'
      },
      {
        label: 'YES — Shows BIOS logo but gets stuck before Windows',
        nextStepId: 'node-boot-loop'
      }
    ]
  },
  'node-boot-ram-check': {
    id: 'node-boot-ram-check',
    question: 'Are motherboard EZ-Debug LEDs lit up (CPU, DRAM, VGA, or BOOT)?',
    contextNote: 'Look at the top-right edge of your motherboard for 4 tiny diagnostic LEDs.',
    options: [
      {
        label: 'DRAM or CPU LED is stuck lit up',
        solution: {
          title: 'RAM Seating & Memory Training Handshake Failure',
          probableCause: 'Improperly seated DDR4/DDR5 RAM stick or DDR5 first-boot memory training delay.',
          severity: 'Moderate',
          responsibleComponent: 'RAM',
          actionSteps: [
            '1. Turn off PC, remove RAM sticks, and re-insert firmly until both side clips click distinctly.',
            '2. For 2-stick DDR5 dual channel, install in Motherboard Slots A2 and B2 (Slots 2 & 4 from left).',
            '3. Try booting with only 1 stick of RAM in Slot A2.',
            '4. Clear Motherboard CMOS by removing the CR2032 coin battery for 5 minutes.'
          ],
          preventativeTip: 'DDR5 memory training can take up to 2-3 minutes on first boot; do not interrupt power.'
        }
      },
      {
        label: 'VGA LED is stuck lit up',
        solution: {
          title: 'GPU PCIe Handshake or Power Cable Defect',
          probableCause: 'GPU not fully clicked into top PCIe x16 slot or missing PCIe / 12VHPWR power cable.',
          severity: 'High',
          responsibleComponent: 'GPU',
          actionSteps: [
            '1. Reseat GPU into the top PCIe x16 slot until the retention latch clicks shut.',
            '2. Ensure dedicated PCIe 6+2 pin cables or 12VHPWR cable are plugged firmly into the GPU.',
            '3. Check that monitor display cable is plugged into the GPU port, NOT the motherboard I/O panel!',
            '4. Try replacing HDMI / DisplayPort cable.'
          ],
          preventativeTip: 'Never use daisy-chained pigtail PCIe power splitters on GPUs drawing over 200W.'
        }
      }
    ]
  },
  'node-boot-loop': {
    id: 'node-boot-loop',
    question: 'Is Windows stuck on a spinning wheel or "Preparing Automatic Repair"?',
    options: [
      {
        label: 'YES — Infinite repair loop',
        solution: {
          title: 'Corrupt Windows Boot Loader (BCD) or SSD File System Failure',
          probableCause: 'Corrupted Windows system files, failed Windows update, or SSD file system error.',
          severity: 'Moderate',
          responsibleComponent: 'SSD',
          actionSteps: [
            '1. Boot into Windows Recovery Environment (WinRE) -> Startup Repair.',
            '2. Open Command Prompt in WinRE and execute: bootrec /fixmbr && bootrec /rebuildbcd.',
            '3. Run sfc /scannow and chkdsk C: /f /r.',
            '4. Reinstall Windows using a clean USB bootable installation drive if corrupt.'
          ],
          preventativeTip: 'Always shut down Windows properly; never cut power while disk drive activity light is blinking.'
        }
      }
    ]
  },

  // --- RANDOM CRASHES DECISION TREE ---
  'node-crash-timing': {
    id: 'node-crash-timing',
    question: 'When do the crashes or freezes occur?',
    options: [
      {
        label: 'Only while playing 3D Games or rendering heavy workloads',
        nextStepId: 'node-crash-load'
      },
      {
        label: 'Randomly while idle or browsing the web',
        nextStepId: 'node-crash-idle'
      }
    ]
  },
  'node-crash-load': {
    id: 'node-crash-load',
    question: 'Does the PC instantly shut off as if unplugged from the wall under gaming load?',
    options: [
      {
        label: 'YES — Instant power cutoff under load',
        solution: {
          title: 'PSU Over-Current Protection (OCP) Tripped or Thermal Shutdown',
          probableCause: 'Power supply wattage is insufficient for GPU transient power spikes, or CPU/GPU hitting thermal limit.',
          severity: 'High',
          responsibleComponent: 'PSU',
          actionSteps: [
            '1. Monitor GPU & CPU temperatures with HWInfo64 during load.',
            '2. Check if PSU wattage meets GPU manufacturer recommendation + 150W safety margin.',
            '3. Upgrade to ATX 3.0 PCIe 5.0 rated PSU to absorb 200% transient power spikes.'
          ],
          preventativeTip: 'Modern GPUs (RTX 4070/4080/4090) experience 20ms transient power spikes up to 2x nominal TGP.'
        }
      },
      {
        label: 'NO — Game closes to desktop or screen freezes',
        solution: {
          title: 'Unstable Memory Profile (XMP/EXPO) or GPU Overclock',
          probableCause: 'RAM operating at unstable XMP/EXPO frequency or factory GPU VRAM instability.',
          severity: 'Moderate',
          responsibleComponent: 'RAM',
          actionSteps: [
            '1. Disable XMP/EXPO in BIOS and test at JEDEC default RAM speed (4800MHz for DDR5).',
            '2. Run MemTest86 or Karhu RAM stress test for 4 passes.',
            '3. Reset custom GPU overclocks to factory stock frequencies in MSI Afterburner.'
          ],
          preventativeTip: 'Ensure motherboard BIOS is updated to latest AGESA / microcode version for memory stability.'
        }
      }
    ]
  },
  'node-crash-idle': {
    id: 'node-crash-idle',
    question: 'Are you using unstable CPU voltage offsets or undervolting curve optimizer?',
    options: [
      {
        label: 'YES — Custom undervolt / PBO Curve Optimizer active',
        solution: {
          title: 'Low-Load CPU Core Instability',
          probableCause: 'Excessive negative Curve Optimizer offset (e.g. -30) causing low-load C-state voltage drops.',
          severity: 'Low',
          responsibleComponent: 'CPU',
          actionSteps: [
            '1. Back off Curve Optimizer negative offset from -30 to -15 or -10 in BIOS.',
            '2. Run CoreCycler or OCCT per-core CPU stress test.',
            '3. Clear CMOS to restore stock CPU voltage curves.'
          ],
          preventativeTip: 'Low-load idle state crashes occur when C-state clock transitions lack sufficient baseline voltage.'
        }
      }
    ]
  }
};

export const POPULAR_BSOD_CODES: BSODLookupEntry[] = [
  {
    code: 'IRQL_NOT_LESS_OR_EQUAL',
    commonName: 'Driver or Memory Corruption',
    likelyCause: 'Faulty device driver trying to access non-paged memory or unstable RAM overclock.',
    fixProcedure: [
      '1. Disable XMP / EXPO in BIOS and test RAM stability.',
      '2. Update GPU and Motherboard chipset drivers to latest versions.',
      '3. Run Windows Driver Verifier to identify failing driver.'
    ]
  },
  {
    code: 'MEMORY_MANAGEMENT',
    commonName: 'RAM Physical Defect or Timings Fault',
    likelyCause: 'Defective RAM stick, bad memory timings, or corrupt Windows pagefile.',
    fixProcedure: [
      '1. Run MemTest86 or Windows Memory Diagnostic.',
      '2. Test individual RAM sticks one by one in Slot A2.',
      '3. Recreate pagefile.sys on C: drive.'
    ]
  },
  {
    code: 'WHEA_UNCORRECTABLE_ERROR',
    commonName: 'Hardware CPU/PCIe Bus Failure',
    likelyCause: 'Unstable CPU voltage, excessive CPU overclock, failing NVMe SSD, or overheating silicon.',
    fixProcedure: [
      '1. Reset BIOS settings to default optimized state.',
      '2. Check CPU temperature under load (must stay < 90°C).',
      '3. Check SMART health status on all connected NVMe SSDs.'
    ]
  },
  {
    code: 'PAGE_FAULT_IN_NONPAGED_AREA',
    commonName: 'Invalid System Memory Access',
    likelyCause: 'Corrupted system driver, faulty antivirus driver, or failing RAM/VRAM.',
    fixProcedure: [
      '1. Run sfc /scannow and DISM /Online /Cleanup-Image /RestoreHealth.',
      '2. Clean uninstall GPU drivers using Display Driver Uninstaller (DDU) in Safe Mode.',
      '3. Reseat RAM and GPU physical slot connections.'
    ]
  }
];
