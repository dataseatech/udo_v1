{{- define "prefect-worker.name" -}}
prefect-worker
{{- end -}}

{{- define "prefect-worker.fullname" -}}
{{ include "prefect-worker.name" . }}
{{- end -}}
