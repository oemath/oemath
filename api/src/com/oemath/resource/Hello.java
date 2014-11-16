package com.oemath.resource;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import javax.ws.rs.CookieParam;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

@Path("/hello")
public class Hello {
    
    @Context ServletContext context;

    @POST
    @Path("/show")
    @Produces(MediaType.TEXT_PLAIN)
    public Response testFormParam(
            @FormParam("name") String name,
            @FormParam("age") int age) {
        
        JSONObject retVal = new JSONObject();
        try {
            retVal.put("name", name);
            retVal.put("age", age);
        }
        catch (JSONException jex) {
            return Response.status(500).entity(jex.toString()).
                    header("Access-Control-Allow-Origin", "http://localhost:8080").build();
        }
        
        return Response.status(200).entity(retVal.toString()).
                header("Access-Control-Allow-Origin", "http://localhost:8080").build();
    }

    
    @GET
    @Path("/test")
    @Produces(MediaType.TEXT_HTML)
    public Response getRoot(@Context HttpServletRequest request, @CookieParam("sessionid") int sessionId) {
        HttpSession session = request.getSession(true);
        session.setMaxInactiveInterval(30);
        String session_id = session.getId();
        
        String body = context.getRealPath("index.html");
//        try {
//            body = new String(Files.readAllBytes(FileSystems.getDefault().getPath(context.getRealPath("OEMATH-TOMCAT.html"))));
            body = "<h1>"+session_id+"</h1>";
            body += "<h2>From Servlet</h2>";
            body += "key1=1000<br/>";
            body += "key2=" + session.getAttribute("key2") + "<br/>";
            session.setAttribute("key1", "1000");
            body += "More to come...";
/*        }
        catch (IOException ioe) {
            body = ioe.toString();
        }*/
        //String body = "<html><head><title>ROOT</title></head><body><h2>!!Hello from ROOT servlet!!BODY</h2></body></html>";
       return Response.status(200).entity(body).
               header("Access-Control-Allow-Origin", "http://localhost:8080").build();
    }

    /*
    @GET
    @Path("/{said}")
    public Response getMsg(@Context HttpServletRequest request, @PathParam("said") String msg, @CookieParam("sessionid") int sessionId) {
        JSONObject obj = new JSONObject();
        try {
            obj.put("msg", msg);
            obj.put("cookie", ""+sessionId++);
            obj.put("addr", request.getRemoteAddr());
            obj.put("port", request.getRemotePort());
            HttpSession session = request.getSession(true);
            obj.put("session_in_request", request.getRequestedSessionId());
            obj.put("session_created", session.getId());
            obj.put("session_user", session.getAttribute("user"));
            session.setMaxInactiveInterval(5);
            session.setAttribute("user", "Olivia");
            
        }
        catch (JSONException jex) {
            return Response.serverError().entity("Server error: "+jex.getMessage()).build();
        }
       return Response.status(200).cookie(new NewCookie("sessionid", ""+sessionId, null, null, null, 1111111, false)).entity(obj.toString()).build();
    }

    @GET
    @Path("/say")
    @Produces(MediaType.TEXT_PLAIN)
    public String sayHelloPlainText() {
        JSONObject obj = new JSONObject();
        try {
            obj.put("result", "Hello Jersey");
            obj.put("result2", "Hello JSON");
        }
        catch (JSONException jex) {
            return jex.getMessage();
        }
        return obj.toString();
    }

    // http://localhost:8080/MyRESTWebService/rest/hello/WA/Sammamish
    // returns "{"param1":"WA","param2":"Sammamish"}"
    @GET
    @Path("{param1}/{param2}")
    @Produces(MediaType.TEXT_PLAIN)
    public String testPathParam(
            @PathParam("param1") String param1,
            @PathParam("param2") String param2) {

        JSONObject retVal = new JSONObject();
        try {
            retVal.put("param1", param1);
            retVal.put("param2", param2);
        }
        catch (JSONException jex) {
            return jex.getMessage();
        }
        
        return retVal.toString();
    }
    
    // http://localhost:8080/MyRESTWebService/rest/hello;state=WA;city=Sammamish
    // returns "{"param1":"WA","param2":"Sammamish"}"
    @GET
    @Produces(MediaType.TEXT_PLAIN)
    public String testMatrixParam(
            @MatrixParam("state") String param1,
            @MatrixParam("city") String param2) {

        JSONObject retVal = new JSONObject();
        try {
            retVal.put("param1", param1);
            retVal.put("param2", param2);
        }
        catch (JSONException jex) {
            return jex.getMessage();
        }
        
        return retVal.toString();
    }
*/
    /*
<!DOCTYPE html>
<html>
 <head>
  <title>Test FormParam</title>
 </head>
 
 <body>

  <form action="http://localhost:8080/MyRESTWebService/rest/hello/show" method="POST">
    <p>Name:<input type="text" name="name"/></p>
    <p>Age:<input type="text" name="age"/></p>
    <input type="submit" value="Show"/>
  </form>
 </body>

 </html>
     */
// return: "{"name":"Robert","age":30}" 
    /*
    @POST
    @Path("/show")
    @Produces(MediaType.TEXT_PLAIN)
    public String testFormParam(
            @FormParam("name") String name,
            @FormParam("age") int age) {
        
        JSONObject retVal = new JSONObject();
        try {
            retVal.put("name", name);
            retVal.put("age", age);
        }
        catch (JSONException jex) {
            return jex.getMessage();
        }
        
        return retVal.toString();
    }
    
    @Path("/version")
    @GET
    @Produces(MediaType.TEXT_PLAIN)
    public String getVersion(
            @DefaultValue("1.0") @QueryParam("ver") String ver) {
        JSONObject obj = new JSONObject();
        try {
            obj.put("Version", ""+ver);
        }
        catch (JSONException jex) {
            return jex.getMessage();
        }
        return obj.toString();
    }


    @Path("/getproblem")
    @GET
    @Produces(MediaType.TEXT_PLAIN)
    public String getProblem(
            @QueryParam("prob") String ver) {
        
        DBConnect dbConn = new DBConnect();
        ResultSet rs = dbConn.execute("select * from prob_g2");
        
        JSONObject obj = new JSONObject();

        try {
            if (rs == null) {
                    obj.put("error", dbConn.getLastError());
            }
            else {
                try {
                    while (rs.next()) {
                        obj.put("pid", rs.getInt("pid"));
                        obj.put("level", rs.getInt("level"));
                        obj.put("category", rs.getInt("category"));
                        obj.put("problem", rs.getString("problem"));
                        obj.put("param", rs.getString("param"));
                        obj.put("answer", rs.getString("answer"));
                        obj.put("hint", rs.getString("hint"));
                    }
                }
                catch (SQLException sqlex) {
                    obj.put("sqlerror", sqlex.getMessage());
                }
            }       
        }
        catch (JSONException jex) {
            return jex.getMessage();
        }

        return obj.toString();
    }*/

}
