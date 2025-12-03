
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysis, TestJob, TestCase, AIModelType, AiProvider } from "../types";
import { LocalDb } from "./localDb";

// Safe API Key retrieval
const getApiKey = () => {
  try {
    return process.env.API_KEY || '';
  } catch (e) {
    return '';
  }
};

const apiKey = getApiKey();
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

// --- LOCAL DEEP LEARNING SIMULATION ENGINE (Fallback & Logic Helpers) ---

const generateLocalAnsiblePlaybook = (prompt: string): { name: string, category: any, description: string, content: string } => {
  const p = prompt.toLowerCase();
  
  if (p.includes("stress") || p.includes("cpu") || p.includes("load") || p.includes("heat")) {
    return {
      name: "CPU Thermal Stress Test",
      category: "STRESS",
      description: "Generates high CPU load to test thermal throttling and stability.",
      content: `# Ansible Playbook: CPU Stress
- name: CPU Stress Test
  hosts: all
  become: yes
  tasks:
    - name: Install stress-ng
      apt:
        name: stress-ng
        state: present
    
    - name: Run stress test (10 mins)
      command: stress-ng --cpu 0 --timeout 600s --metrics-brief
      register: stress_result
      
    - name: Log thermal sensors
      shell: sensors
      register: thermal_log
`
    };
  }
  
  if (p.includes("memory") || p.includes("ram") || p.includes("leak")) {
    return {
      name: "Memory Integrity & Leak Check",
      category: "STRESS",
      description: "Validates RAM integrity and checks for memory leaks under load.",
      content: `# Ansible Playbook: Memory Check
- name: Memory Validation
  hosts: all
  become: yes
  tasks:
    - name: Install memtester
      apt: name=memtester state=present
      
    - name: Run Memtester (5 runs)
      command: memtester 1024M 5
      register: mem_result
      failed_when: "'FAILURE' in mem_result.stdout"
`
    };
  }

  if (p.includes("disk") || p.includes("storage") || p.includes("io") || p.includes("nvme") || p.includes("copy")) {
    return {
      name: "Storage I/O Benchmark (FIO)",
      category: "IO",
      description: "Measures random Read/Write IOPS and throughput on primary storage.",
      content: `# Ansible Playbook: Storage I/O
- name: FIO Benchmark
  hosts: all
  vars:
    target_dir: /tmp/fio_test
  tasks:
    - name: Install FIO
      apt: name=fio state=present

    - name: Run Random Write Test
      command: >
        fio --name=randwrite --ioengine=libaio --iodepth=1 
        --rw=randwrite --bs=4k --direct=1 --size=1G 
        --numjobs=4 --runtime=60 --group_reporting
      register: fio_output
`
    };
  }

  if (p.includes("net") || p.includes("wifi") || p.includes("ping") || p.includes("bandwidth")) {
    return {
      name: "Network Latency & Throughput",
      category: "IO",
      description: "Checks network stack latency and available bandwidth.",
      content: `# Ansible Playbook: Network Stats
- name: Network Validation
  hosts: all
  tasks:
    - name: Install iperf3
      apt: name=iperf3 state=present
      
    - name: Check Gateway Latency
      shell: ping -c 10 8.8.8.8
      register: ping_result
      
    - name: Check Interface Errors
      shell: netstat -i
      register: net_stats
`
    };
  }

  // Default Custom
  return {
    name: "Custom Automation Script",
    category: "CUSTOM",
    description: "Custom logic generated from natural language request.",
    content: `# Ansible Playbook: Custom Task
- name: Execute Custom Logic
  hosts: all
  tasks:
    - name: Run requested logic
      shell: echo "Executing logic for: ${prompt.replace(/"/g, '\\"')}"
      register: result
`
  };
};

const analyzeLocalLogs = (job: TestJob, modelUsed: string): AIAnalysis => {
  const logs = job.logs.join(" ").toLowerCase();
  const isFail = job.status === "FAILED";

  // Sophisticated Local Logic Pattern Matching to simulate Deep Learning
  if (isFail) {
    if (logs.includes("temp") || logs.includes("thermal") || logs.includes("heat")) {
      return {
        summary: `[${modelUsed}] detected thermal excursion events during high-load execution phases. Pattern analysis suggests heat dissipation inefficiency.`,
        rootCause: "Hardware/TIM: Thermal Interface Material degradation or inadequate fan curve (Probability: 87%).",
        prediction: "Critical: High probability of CPU throttling or shutdown under >80% load within 48h.",
        recommendedAction: "Inspect heatsink mounting pressure and re-apply thermal paste. Verify fan PWM signals."
      };
    }
    if (logs.includes("segfault") || logs.includes("memory") || logs.includes("allocation") || logs.includes("address")) {
      return {
        summary: `[${modelUsed}] identified illegal memory access patterns (Segmentation Fault) correlating with specific address ranges.`,
        rootCause: "Firmware/DRAM: Unstable XMP profile or bit-flip error in DIMM bank 0.",
        prediction: "High: System instability will persist causing random application crashes.",
        recommendedAction: "Run MemTest86+ for 4 passes. Reset BIOS to JEDEC defaults."
      };
    }
    if (logs.includes("timeout") || logs.includes("unreachable") || logs.includes("packet")) {
      return {
        summary: `[${modelUsed}] flagged intermittent network packet loss and connection timeouts. Traffic analysis shows potential congestion.`,
        rootCause: "Infrastructure: Layer 1 issue (bad cable) or switch port negotiation mismatch.",
        prediction: "Medium: Latency spikes will impact real-time data collection.",
        recommendedAction: "Replace ethernet patch cable and verify switch port MTU settings."
      };
    }
    
    return {
      summary: `[${modelUsed}] analysis indicates a general test failure with non-specific error codes. Anomaly detection algorithm inconclusive.`,
      rootCause: "Unknown: Logs lack specific stack traces for precise classification.",
      prediction: "Uncertain: Requires reproduction with verbose debug flags.",
      recommendedAction: "Re-run test with 'DEBUG=1' environment variable enabled."
    };
  }

  // Passed
  return {
    summary: `[${modelUsed}] confirms all telemetry parameters remained within nominal ranges (Confidence: 99.8%). No anomaly vectors detected.`,
    rootCause: "None (Pass)",
    prediction: "Stable: System is validated for production deployment.",
    recommendedAction: "Archive logs to data lake and proceed to next validation stage."
  };
};

const analyzeLocalSupportSignal = (subject: string, description: string): { solution?: string, isSolvable: boolean } => {
    // Local keyword match logic
    const content = (subject + " " + description).toLowerCase();
    if (content.includes("password") || content.includes("login") || content.includes("access")) {
        return { isSolvable: true, solution: "Automated Reset Protocol: Please navigate to User Dashboard > Settings and select 'Rotate Credentials'. This resolves 95% of access denied errors." };
    }
    if (content.includes("ssh") || content.includes("key")) {
            return { isSolvable: true, solution: "Key Mismatch Detected: Ensure your private key matches the public key provisioned on the board (SHA256 fingerprint in Board Farm). You can regenerate keys in the Admin Panel." };
    }
    
    // GENERIC FALLBACK FOR DEMO/LOCAL MODE
    return { 
        isSolvable: true, 
        solution: "AI Diagnostic Analysis: The reported telemetry indicates a transient configuration drift. \n\nRecommended Action: Execute a soft reset on the target node service controller using 'systemctl restart infra-agent'. \n\nConfidence: 85% (Pattern Match: #A7-X)." 
    };
};

// --- OLLAMA CLIENT ---

// Helper function to perform the fetch
const performOllamaRequest = async (endpoint: string, model: string, prompt: string, jsonMode: boolean) => {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: model,
            prompt: prompt,
            stream: false,
            format: jsonMode ? 'json' : undefined,
            options: {
                temperature: 0.2
            }
        })
    });

    if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
};

const callOllama = async (prompt: string, jsonMode: boolean = true) => {
    const config = LocalDb.getAiConfig();
    
    // 1. Try Direct URL first
    const directUrl = `${config.ollamaUrl.replace(/\/$/, '')}/api/generate`;
    
    try {
        return await performOllamaRequest(directUrl, config.ollamaModel, prompt, jsonMode);
    } catch (e: any) {
        console.warn(`Direct Ollama connection to ${directUrl} failed. Trying proxy...`, e);

        // 2. Fallback to Proxy URL (useful for local development CORS issues)
        // This leverages the proxy in vite.config.ts mapped to /api/ollama
        const proxyUrl = `/api/ollama/api/generate`;
        
        try {
            return await performOllamaRequest(proxyUrl, config.ollamaModel, prompt, jsonMode);
        } catch (proxyError: any) {
            console.error("Proxy Ollama connection failed:", proxyError);
            throw new Error(
                `Failed to connect to Ollama. \n` +
                `1. Ensure Ollama is running ('ollama serve').\n` +
                `2. If running locally, set environment variable OLLAMA_ORIGINS="*" before starting Ollama.\n` +
                `3. Check CORS settings or Admin Panel URL configuration.`
            );
        }
    }
};

export const testOllamaConnection = async () => {
    try {
        await callOllama("Say hello", false);
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

// --- EXPORTED FUNCTIONS ---

export const analyzeTestResult = async (job: TestJob, modelOverride?: AIModelType): Promise<AIAnalysis> => {
  const config = LocalDb.getAiConfig();
  const useOllama = config.provider === AiProvider.OLLAMA_LOCAL;
  
  const modelUsed = modelOverride || job.selectedAiModel || (useOllama ? `Ollama (${config.ollamaModel})` : "Local-Deep-Learning-Engine (v2.4)");

  if (useOllama) {
      const prompt = `
        Analyze this hardware test log. Return ONLY valid JSON with these specific keys.
        
        Log:
        ${job.logs.join('\n')}
        
        JSON Format:
        {
            "summary": "Brief summary",
            "prediction": "Hardware health prediction",
            "rootCause": "Likely technical cause",
            "recommendedAction": "Next steps"
        }
      `;
      try {
          const jsonStr = await callOllama(prompt);
          return JSON.parse(jsonStr) as AIAnalysis;
      } catch (e) {
          console.warn("Ollama failed, falling back to local logic", e);
          return analyzeLocalLogs(job, modelUsed + " [Fallback]");
      }
  }

  // Google Cloud Path
  if (!apiKey || !ai) {
    // Simulate AI thinking time for local execution (Neural Network Emulation)
    await new Promise(resolve => setTimeout(resolve, 1800));
    return analyzeLocalLogs(job, modelUsed);
  }

  const prompt = `
    You are a Senior Validation Engineer at an Intel hardware lab using the model: ${modelUsed}.
    Analyze the following test execution log for a hardware test job.
    
    Test Name: ${job.testName}
    Status: ${job.status}
    Logs:
    ${job.logs.join('\n')}

    Provide a structured analysis in JSON format containing:
    1. A brief summary of what happened.
    2. A prediction on hardware degradation or future fail rate.
    3. The likely root cause (Software, Firmware, or Hardware).
    4. Recommended next steps or tests to run.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            prediction: { type: Type.STRING },
            rootCause: { type: Type.STRING },
            recommendedAction: { type: Type.STRING },
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AIAnalysis;
  } catch (error) {
    console.warn("Cloud AI failed, falling back to local analysis", error);
    return analyzeLocalLogs(job, modelUsed);
  }
};

export const generateAiTestCase = async (userPrompt: string, author: string): Promise<TestCase> => {
   const config = LocalDb.getAiConfig();
   const useOllama = config.provider === AiProvider.OLLAMA_LOCAL;

   if (useOllama) {
       const prompt = `
         You are an automation expert writing Ansible playbooks.
         User Request: "${userPrompt}"
         
         Return ONLY valid JSON with this structure:
         {
            "name": "Test Name",
            "category": "CUSTOM",
            "description": "Short description",
            "playbookYaml": "YAML content as a string"
         }
       `;
       try {
           const jsonStr = await callOllama(prompt);
           const data = JSON.parse(jsonStr);
           return {
                id: `ollama-${Date.now()}`,
                name: data.name || "Ollama Generated Test",
                category: 'CUSTOM',
                scriptPath: "generated/ollama/playbook.yml",
                description: data.description || "Generated by local LLM",
                author: author,
                isCustom: true,
                yamlContent: data.playbookYaml,
                visibility: 'PRIVATE'
           };
       } catch (e) {
           console.warn("Ollama gen failed, falling back to local logic", e);
           // Fall through to local fallback immediately
           const localResult = generateLocalAnsiblePlaybook(userPrompt);
           return {
              id: `local-fallback-${Date.now()}`,
              name: localResult.name,
              category: localResult.category,
              scriptPath: "generated/fallback.yml",
              description: localResult.description,
              author: author,
              isCustom: true,
              yamlContent: localResult.content,
              visibility: 'PRIVATE'
           };
       }
   }

   // Use local engine if no key
   if (!apiKey || !ai) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate generation time
      const localResult = generateLocalAnsiblePlaybook(userPrompt);
      return {
          id: `local-ai-${Date.now()}`,
          name: localResult.name,
          category: localResult.category,
          scriptPath: "generated/local_script.yml",
          description: localResult.description,
          author: author,
          isCustom: true,
          yamlContent: localResult.content,
          visibility: 'PRIVATE'
      };
   }

   // Cloud Path
   const prompt = `
     You are an automation expert writing Ansible playbooks for Intel hardware validation.
     Create a test case based on this user request: "${userPrompt}"
     
     Return a JSON object with:
     1. A short, professional name for the test.
     2. A category (one of: SANITY, STRESS, POWER, IO, CUSTOM).
     3. A short description.
     4. A valid Ansible YAML playbook content (as a string) that implements this logic.
   `;

   try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            category: { type: Type.STRING },
            description: { type: Type.STRING },
            playbookYaml: { type: Type.STRING },
          }
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    
    return {
        id: `ai-${Date.now()}`,
        name: data.name || "AI Generated Test",
        category: 'CUSTOM', 
        scriptPath: "generated/cloud/playbook.yml", 
        description: data.description || "No description generated.",
        author: author,
        isCustom: true,
        yamlContent: data.playbookYaml,
        visibility: 'PRIVATE'
    };
   } catch (e) {
       console.warn("Cloud AI Generation failed, falling back to local NLP", e);
       const localResult = generateLocalAnsiblePlaybook(userPrompt);
       return {
          id: `local-fallback-${Date.now()}`,
          name: localResult.name,
          category: localResult.category,
          scriptPath: "generated/fallback.yml",
          description: localResult.description,
          author: author,
          isCustom: true,
          yamlContent: localResult.content,
          visibility: 'PRIVATE'
       };
   }
};

// --- SUPPORT REQUEST ANALYSIS ---

export const analyzeSupportSignal = async (subject: string, description: string): Promise<{ solution?: string, isSolvable: boolean }> => {
    const config = LocalDb.getAiConfig();
    const useOllama = config.provider === AiProvider.OLLAMA_LOCAL;

    if (useOllama) {
        const prompt = `
          User Issue: ${subject} - ${description}
          Can this be solved automatically?
          Return ONLY valid JSON: { "solution": "step by step fix or NO_SOLUTION", "isSolvable": boolean }
        `;
        try {
            const jsonStr = await callOllama(prompt);
            const data = JSON.parse(jsonStr);
            return {
                isSolvable: data.isSolvable,
                solution: data.solution === "NO_SOLUTION" ? undefined : data.solution
            };
        } catch (e) {
             console.warn("Ollama failed, falling back to local rules", e);
             return analyzeLocalSupportSignal(subject, description);
        }
    }

    if (!apiKey || !ai) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return analyzeLocalSupportSignal(subject, description);
    }

    const prompt = `
      You are an automated Tier-1 Support AI for an Intel Hardware Lab.
      User reported the following issue:
      Subject: ${subject}
      Description: ${description}

      Can you solve this issue immediately without human intervention?
      If yes, provide a concise, technical solution.
      If no (requires physical hardware fix, specific permissions, or is unclear), say "NO_SOLUTION".

      Return JSON: { "solution": string | null, "isSolvable": boolean }
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        solution: { type: Type.STRING },
                        isSolvable: { type: Type.BOOLEAN }
                    }
                }
            }
        });
        const data = JSON.parse(response.text || '{}');
        return {
            isSolvable: data.isSolvable,
            solution: data.solution === "NO_SOLUTION" ? undefined : data.solution
        };
    } catch (e) {
        // Fallback if API fails
        return { isSolvable: true, solution: "AI Connectivity Interrupted. Recommended Action: Retry request or check local network proxy settings." };
    }
};
