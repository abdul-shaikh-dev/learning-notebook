"""Offline lab contract checks; not Kubernetes admission or CNI validation."""
import json
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parent
def documents():
    for file in ROOT.glob("*.json"):
        value=json.loads(file.read_text(encoding="utf-8"))
        for item in value.get("items",[value]):yield file.name,item
class ManifestChecks(unittest.TestCase):
    def test_namespace_and_supported_api(self):
        allowed={"v1","apps/v1","batch/v1","networking.k8s.io/v1","rbac.authorization.k8s.io/v1","autoscaling/v2","policy/v1"}
        for file,obj in documents():
            self.assertIn(obj["apiVersion"],allowed,file)
            self.assertEqual(obj["metadata"].get("namespace","notebook-lab"),"notebook-lab",file)
            if obj["kind"]=="Namespace":self.assertEqual(obj["metadata"]["name"],"notebook-lab")
    def test_selectors_ports_and_security(self):
        docs=[obj for _,obj in documents()];deploy=next(o for o in docs if o["kind"]=="Deployment");svc=next(o for o in docs if o["kind"]=="Service")
        labels=deploy["spec"]["template"]["metadata"]["labels"];self.assertEqual(deploy["spec"]["selector"]["matchLabels"],svc["spec"]["selector"])
        self.assertTrue(all(labels.get(k)==v for k,v in svc["spec"]["selector"].items()))
        pod=deploy["spec"]["template"]["spec"];self.assertFalse(pod["automountServiceAccountToken"])
        c=pod["containers"][0];self.assertEqual(c["ports"][0]["name"],svc["spec"]["ports"][0]["targetPort"]);self.assertEqual(c["imagePullPolicy"],"Never")
        self.assertFalse(c["securityContext"]["allowPrivilegeEscalation"]);self.assertTrue(c["securityContext"]["readOnlyRootFilesystem"])
        self.assertEqual(c["livenessProbe"]["httpGet"]["path"],"/live");self.assertEqual(c["readinessProbe"]["httpGet"]["path"],"/ready")
    def test_optional_boundaries(self):
        docs=[obj for _,obj in documents()];role=next(o for o in docs if o["kind"]=="Role");self.assertNotIn("secrets",role["rules"][0]["resources"]);self.assertNotIn("*",role["rules"][0]["verbs"])
        job=next(o for o in docs if o["kind"]=="Job");self.assertEqual(job["spec"]["template"]["spec"]["restartPolicy"],"Never");self.assertLessEqual(job["spec"]["activeDeadlineSeconds"],60)
        hpa=next(o for o in docs if o["kind"]=="HorizontalPodAutoscaler");self.assertLessEqual(hpa["spec"]["maxReplicas"],4)
    def test_guard_is_explicit(self):
        script=(ROOT/"lab.ps1").read_text(encoding="utf-8");self.assertIn("kind-notebook-lab",script);self.assertIn("127",script);self.assertIn("training-owner",script);self.assertIn("--dry-run=server",script)
if __name__=="__main__":unittest.main()
