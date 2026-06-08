package io.couplehub.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

public class TodoWidget extends AppWidgetProvider {

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        // Construct the RemoteViews object
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_todo);

        // Fetch data from Capacitor Preferences
        SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        String todosJson = prefs.getString("widget_todos", "[]");

        StringBuilder todoText = new StringBuilder();
        try {
            JSONArray arr = new JSONArray(todosJson);
            int count = 0;
            for (int i = 0; i < arr.length(); i++) {
                JSONObject todo = arr.getJSONObject(i);
                boolean isCompleted = todo.optBoolean("isCompleted", false);
                if (!isCompleted) {
                    todoText.append("• ").append(todo.getString("title")).append("\n");
                    count++;
                }
                if (count >= 5) break; // limit to 5 items in widget
            }
            if (count == 0) {
                todoText.append("Niciun task activ!");
            }
        } catch (Exception e) {
            todoText.append("Eroare la încărcare.");
        }

        views.setTextViewText(R.id.appwidget_text, todoText.toString());

        // Intent to launch the app when clicked via deep link
        Intent intent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse("couplehub://app/todo"));
        intent.setPackage(context.getPackageName());
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent);

        // Instruct the widget manager to update the widget
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        // There may be multiple widgets active, so update all of them
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }
}
