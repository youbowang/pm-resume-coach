param(
  [string]$AppId = "797a77b9-cf47-43a1-a320-f9e634cd6ad9",
  [string]$StatePath = "dify-state.json"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $StatePath)) {
  throw "Missing $StatePath. Run: npx --yes --package @playwright/cli playwright-cli state-save dify-state.json"
}

$state = Get-Content -LiteralPath $StatePath -Raw | ConvertFrom-Json
$cookies = @($state.cookies) | Where-Object { $_.domain -like "*dify.ai" }
$cookieHeader = ($cookies | ForEach-Object { "$($_.name)=$($_.value)" }) -join "; "
$csrfCookie = $cookies | Where-Object { $_.name -eq "csrf_token" -or $_.name -eq "__Host-csrf_token" } | Select-Object -First 1
if (-not $csrfCookie) {
  throw "Missing csrf_token cookie in $StatePath"
}
$accessCookie = $cookies | Where-Object { $_.name -eq "__Host-access_token" } | Select-Object -First 1
if (-not $accessCookie) {
  throw "Missing access token cookie in $StatePath"
}

$headers = @{
  "Cookie" = $cookieHeader
  "x-csrf-token" = [System.Uri]::UnescapeDataString($csrfCookie.value)
  "authorization" = "Bearer $([System.Uri]::UnescapeDataString($accessCookie.value))"
  "content-type" = "application/json"
  "referer" = "https://cloud.dify.ai/app/$AppId/workflow"
}

$base = "https://cloud.dify.ai/console/api/apps/$AppId/workflows/draft"
$draft = Invoke-RestMethod -Method Get -Uri $base -Headers $headers
$prompt = Get-Content -LiteralPath (Join-Path $PSScriptRoot "dify-prompt.txt") -Raw -Encoding UTF8

$graph = @{
  nodes = @(
    @{
      id = "1783606417170"
      type = "custom"
      data = @{
        variables = @(
          @{ variable = "job_type"; label = "Job Type"; type = "select"; required = $true; options = @("AI Product", "User Product", "Growth Product", "Content Product", "Platform Product", "Not Sure") },
          @{ variable = "job_description"; label = "Target JD"; type = "paragraph"; required = $true; max_length = 8000 },
          @{ variable = "resume_text"; label = "Resume Text"; type = "paragraph"; required = $true; max_length = 12000 },
          @{ variable = "target_experience"; label = "Target Experience"; type = "paragraph"; required = $false; max_length = 4000 }
        )
        type = "start"
        title = "User Input"
        selected = $false
      }
      position = @{ x = 80; y = 282 }
      targetPosition = "left"
      sourcePosition = "right"
      positionAbsolute = @{ x = 80; y = 282 }
      width = 242
      height = 260
    },
    @{
      id = "llm_resume_report"
      type = "custom"
      data = @{
        model = @{
          provider = "langgenius/openai/openai"
          name = "gpt-4"
          mode = "chat"
          completion_params = @{ temperature = 0.2 }
        }
        prompt_template = @(@{ role = "system"; text = $prompt })
        context = @{ enabled = $false; variable_selector = @() }
        vision = @{ enabled = $false }
        type = "llm"
        title = "Generate Resume Report"
        selected = $false
      }
      position = @{ x = 420; y = 282 }
      targetPosition = "left"
      sourcePosition = "right"
      positionAbsolute = @{ x = 420; y = 282 }
      width = 242
      height = 110
    },
    @{
      id = "end_report"
      type = "custom"
      data = @{
        outputs = @(@{ variable = "resume_report"; value_selector = @("llm_resume_report", "text") })
        type = "end"
        title = "Output Resume Report"
        selected = $true
      }
      position = @{ x = 760; y = 282 }
      targetPosition = "left"
      sourcePosition = "right"
      positionAbsolute = @{ x = 760; y = 282 }
      width = 242
      height = 90
    }
  )
  edges = @(
    @{
      id = "1783606417170-source-llm_resume_report-target"
      type = "custom"
      source = "1783606417170"
      sourceHandle = "source"
      target = "llm_resume_report"
      targetHandle = "target"
      data = @{ sourceType = "start"; targetType = "llm"; isInIteration = $false; isInLoop = $false }
      zIndex = 0
    },
    @{
      id = "llm_resume_report-source-end_report-target"
      type = "custom"
      source = "llm_resume_report"
      sourceHandle = "source"
      target = "end_report"
      targetHandle = "target"
      data = @{ sourceType = "llm"; targetType = "end"; isInIteration = $false; isInLoop = $false }
      zIndex = 0
    }
  )
  viewport = @{ x = 0; y = 0; zoom = 0.85 }
}

$body = @{
  graph = $graph
  features = $draft.features
  environment_variables = @($draft.environment_variables)
  conversation_variables = @($draft.conversation_variables)
  rag_pipeline_variables = @($draft.rag_pipeline_variables)
  hash = $draft.hash
} | ConvertTo-Json -Depth 100

$result = Invoke-RestMethod -Method Post -Uri $base -Headers $headers -Body $body
$result | ConvertTo-Json -Depth 20
