package com.oemath.resource2;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

public class RawHandler extends HttpServlet {
	private static final long serialVersionUID = 1L;
	
	public RawHandler() {}
	
	private int count = 0;
	
	@Override
	protected void doGet(HttpServletRequest request,
			HttpServletResponse response) throws ServletException, IOException {
		// Set a cookie for the user, so that the counter does not increate
	    // every time the user press refresh
	    HttpSession session = request.getSession(true);
	    // Set the session valid for 5 secs
	    session.setMaxInactiveInterval(5);
	    response.setContentType("text/plain");
	    response.addHeader("oemath-header", "oemath-header-value");
	    PrintWriter out = response.getWriter();
	    if (session.isNew()) {
	      count++;
	    }
	    out.println("This site has been accessed " + count + " times.");
        JSONObject retVal = new JSONObject();
        try {
            retVal.put("name", "Robert");
            retVal.put("age", 123);
        }
        catch (JSONException jex) {
        	out.println(jex.toString());
        	return;
        }

        out.println(retVal.toString());
	}

	@Override
	  public void init() {
	  }
}
