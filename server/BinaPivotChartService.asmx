<%@ WebService Language="C#" Class="BinaPivotChartService" %>
using System;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Services;
using System.Web.Script.Services;
using System.Web.Script.Serialization;

// ASP.NET Framework ASMX reference implementation. Put this .asmx file in an IIS ASP.NET 4.x site.
// Configure authorization appropriate to your application before production deployment.
[WebService(Namespace = "https://bina.local/chart")]
[ScriptService]
public class BinaPivotChartService : WebService {
    private static readonly Regex IdRule = new Regex(@"^[A-Za-z0-9_-]{1,90}$", RegexOptions.Compiled);
    private static readonly object Gate = new object();
    private string GetPath(string chartId) {
        if (String.IsNullOrWhiteSpace(chartId) || !IdRule.IsMatch(chartId))
            throw new ArgumentException("Invalid chartId");
        string folder = Server.MapPath("~/App_Data/BinaPivotCharts");
        Directory.CreateDirectory(folder);
        return Path.Combine(folder, chartId + ".json");
    }
    private void RequireEditor() {
        // Implement your application's real Designer permission check here.
        if (Context.User == null || !Context.User.Identity.IsAuthenticated)
            throw new HttpException(403, "Login required to save chart definitions");
        // Replace this with a role/permission check, e.g. your internal BINA authorization service.
    }
    [WebMethod]
    [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
    public string SaveChart(string chartId, string definition) {
        RequireEditor();
        if (definition == null || definition.Length > 1024 * 1024)
            throw new ArgumentException("Chart definition too large");
        // Validate JSON before writing; no SQL or expressions from chart settings are executed here.
        object obj = new JavaScriptSerializer { MaxJsonLength = 1024 * 1024 }.DeserializeObject(definition);
        var root = obj as System.Collections.Generic.Dictionary<string, object>;
        if (root == null || !root.ContainsKey("schema") || Convert.ToString(root["schema"]) != "bina-pivotchart")
            throw new ArgumentException("Invalid chart schema");
        string path = GetPath(chartId);
        lock (Gate) {
            string tmp = path + ".tmp";
            File.WriteAllText(tmp, definition, new UTF8Encoding(false));
            if (File.Exists(path)) File.Delete(path);
            File.Move(tmp, path);
        }
        return "OK";
    }
    [WebMethod]
    [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
    public string GetChart(string chartId) {
        // Replace with chart-level authorization if different users have different access.
        if (Context.User == null || !Context.User.Identity.IsAuthenticated)
            throw new HttpException(403, "Login required to read chart definitions");
        string path = GetPath(chartId);
        if (!File.Exists(path)) throw new FileNotFoundException("Chart not found");
        return File.ReadAllText(path, Encoding.UTF8);
    }
}
