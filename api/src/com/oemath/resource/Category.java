package com.oemath.resource;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import com.oemath.resource.DBConnect;

@Path("/category")
public class Category {
    
    @GET
    @Produces(MediaType.TEXT_PLAIN)
    public String getCategory(
        @QueryParam("grade") String grade) {
        
        DBConnect dbConn = new DBConnect();
        ResultSet rs = dbConn.execute("select cid, title, description from category where grade=" + grade + " order by cid");
        
        JSONObject obj = new JSONObject();
        List<JSONObject> categories = new ArrayList<JSONObject>();
        JSONObject category;

        try {
            if (rs == null) {
                    obj.put("error", dbConn.getLastError());
            }
            else {
                try {
                    while (rs.next()) {
                        category = new JSONObject();
                        category.put("cid", rs.getInt("cid"));
                        category.put("title", rs.getString("title"));
                        category.put("description", rs.getString("description"));
                        categories.add(category);
                    }
                    obj.put("categories", categories);
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
    }
}
